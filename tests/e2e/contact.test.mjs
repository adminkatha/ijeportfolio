// End-to-end test of the contact form against a local fake of the Apps Script webhook.
//
//   node tests/e2e/contact.test.mjs                 # builds twice (without, then with the env vars), runs everything
//   node tests/e2e/contact.test.mjs --skip-build    # reuse the current .next (built WITH the contact env vars)
//   node tests/e2e/contact.test.mjs --port 3301     # port for `next start` (default 3301)
//
// Needs the local Chrome (like `pnpm screens`). Leaves .next built with test values for the form:
// run `pnpm build` again before `pnpm start` or a deploy.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { chromium } from "playwright";
import { startFakeWebhook } from "./fake-webhook.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = Number(option("port", "3301"));
const BASE = `http://localhost:${PORT}`;
const SKIP_BUILD = args.includes("--skip-build");
const EMAIL = "ehjaylorenzo2@gmail.com";
const SECRET = `test-${randomBytes(16).toString("hex")}`;
const NEXT = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const WAIT_PAST_MIN_FILL = 3_300;

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail && !ok ? `\n      ${detail}` : ""}`);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (error) {
    check(name, false, String(error?.stack ?? error).split("\n").slice(0, 4).join("\n      "));
  }
}

function runNext(nextArgs, env, { quiet = true } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT, ...nextArgs], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    child.on("exit", (code) => {
      if (code === 0) resolve(log);
      else reject(new Error(`next ${nextArgs.join(" ")} failed (${code}):\n${log.slice(-3000)}`));
    });
    if (!quiet) child.stdout.pipe(process.stdout);
  });
}

async function startServer(env) {
  const child = spawn(process.execPath, [NEXT, "start", "-p", String(PORT)], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (child.exitCode !== null) throw new Error(`next start exited:\n${log}`);
    try {
      const res = await fetch(BASE);
      if (res.status < 500) return { child, log: () => log };
    } catch {
      // not up yet
    }
    await sleep(300);
  }
  child.kill();
  throw new Error(`next start did not answer on ${BASE}`);
}

async function stopServer(server) {
  if (!server || server.child.exitCode !== null) return;
  const exited = new Promise((r) => server.child.once("exit", r));
  server.child.kill();
  await Promise.race([exited, sleep(5000)]);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
}

/** A JS-enabled page that records console errors, page errors and failed responses. */
async function newWatchedPage(browser, problems, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error" || /hydrat/i.test(msg.text())) problems.push(`console.${msg.type()}: ${msg.text().slice(0, 300)}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${String(err).slice(0, 300)}`));
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`);
  });
  return { context, page };
}

const form = (page) => page.locator("#contact-form");
const status = (page) => page.locator("#contact-form [role=status]");
const submit = (page) => page.locator("#contact-form button[type=submit]");

/** Fills every visible field with valid values. Focusing the form first starts the signed clock. */
async function fillValid(page, overrides = {}) {
  const v = {
    name: "Test Visitor",
    email: "visitor@example.com",
    company: "Example Co",
    inquiry: "Freelance project",
    message: "Hello Ehjay,\nI'd like to talk about a project.\nThanks!",
    ...overrides,
  };
  await page.locator("#cf-name").fill(v.name);
  await page.locator("#cf-email").fill(v.email);
  await page.locator("#cf-company").fill(v.company);
  await page.getByRole("radio", { name: v.inquiry }).check();
  await page.locator("#cf-message").fill(v.message);
  return v;
}

/** Focus the first field and wait until the signed start time has arrived from the server. */
async function startClock(page) {
  await page.locator("#cf-name").focus();
  await page.waitForFunction(() => document.querySelector("#contact-form input[name=t]")?.value.length > 10, null, { timeout: 10_000 });
}

async function main() {
  let server = null;
  const hook = await startFakeWebhook({ secret: SECRET });
  const configuredEnv = { CONTACT_WEBHOOK_URL: hook.url, CONTACT_SECRET: SECRET };
  const browser = await launchBrowser();

  try {
    // ── 1. Not configured → "Email me instead" ───────────────────────────────────────────────
    if (!SKIP_BUILD) {
      console.log("Building without CONTACT_* …");
      await runNext(["build"], { CONTACT_WEBHOOK_URL: "", CONTACT_SECRET: "" });
      server = await startServer({ CONTACT_WEBHOOK_URL: "", CONTACT_SECRET: "" });
      console.log("Without the env vars:");
      await step("renders “Email me instead” with a mailto link and no form", async () => {
        const problems = [];
        const { context, page } = await newWatchedPage(browser, problems);
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        const hasForm = await form(page).count();
        const text = await page.locator("#contact").innerText();
        const mailto = await page.locator(`#contact a[href="mailto:${EMAIL}"]`).count();
        check("renders “Email me instead” with a mailto link and no form", hasForm === 0 && /email me instead/i.test(text) && mailto === 1, `form=${hasForm} mailto=${mailto} text=${text.slice(0, 200)}`);
        check("no console errors or failed requests (unconfigured)", problems.length === 0, problems.join("\n      "));
        await context.close();
      });
      await stopServer(server);
      server = null;

      console.log("Building with CONTACT_* pointing at the fake webhook …");
      await runNext(["build"], configuredEnv);
    }

    server = await startServer(configuredEnv);
    const problems = [];
    console.log("With JavaScript:");

    // ── 2. Empty submit → inline errors, focus on the first ──────────────────────────────────
    await step("empty submit shows inline errors and focuses the first", async () => {
      const { context, page } = await newWatchedPage(browser, problems);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await submit(page).click();
      await page.locator("#cf-name-error").waitFor();
      const errors = await page.locator("#contact-form [id$='-error']").evaluateAll((els) => els.map((e) => e.id));
      const expected = ["cf-name-error", "cf-email-error", "cf-inquiryType-error", "cf-message-error"];
      check("empty submit: an error for each required field (and none for Company)", expected.every((e) => errors.includes(e)) && !errors.includes("cf-company-error"), errors.join(", "));
      const name = page.locator("#cf-name");
      check("empty submit: aria-invalid + aria-describedby tie the error to the field", (await name.getAttribute("aria-invalid")) === "true" && (await name.getAttribute("aria-describedby"))?.includes("cf-name-error"));
      check("empty submit: focus moved to the first invalid field", (await page.evaluate(() => document.activeElement?.id)) === "cf-name");
      check("empty submit: nothing reached the webhook", hook.received.length === 0);
      // Fill one field, submit again: the error clears for it and its value is kept.
      await page.locator("#cf-name").fill("Kept Name");
      await submit(page).click();
      await page.locator("#cf-name-error").waitFor({ state: "detached" });
      check("second submit: fixed field loses its error and keeps its value", (await page.locator("#cf-name").inputValue()) === "Kept Name");
      check("second submit: focus moves to the next invalid field (Email)", (await page.evaluate(() => document.activeElement?.id)) === "cf-email");
      await context.close();
    });

    // ── 3. Too fast → rejected ────────────────────────────────────────────────────────────────
    await step("too fast is rejected", async () => {
      const { context, page } = await newWatchedPage(browser, problems);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await startClock(page);
      const v = await fillValid(page);
      await submit(page).click();
      await status(page).getByText(/that was quick/i).waitFor();
      check("too fast: rejected with a “press Send again” message", true);
      check("too fast: nothing reached the webhook", hook.received.length === 0);
      check("too fast: the typed values are kept", (await page.locator("#cf-message").inputValue()) === v.message);
      await context.close();
    });

    // ── 4. Honeypot → rejected ────────────────────────────────────────────────────────────────
    await step("honeypot is rejected", async () => {
      const { context, page } = await newWatchedPage(browser, problems);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      const trap = page.locator("#cf-website");
      check("honeypot: not reachable (aria-hidden wrapper, tabindex -1, autocomplete off)",
        (await trap.getAttribute("tabindex")) === "-1" && (await trap.getAttribute("autocomplete")) === "off" &&
        (await page.locator("#cf-website").evaluate((el) => el.closest("[aria-hidden='true']") !== null)));
      await startClock(page);
      await fillValid(page);
      await trap.evaluate((el) => (el.value = "https://spam.example.com"));
      await sleep(WAIT_PAST_MIN_FILL);
      await submit(page).click();
      await status(page).getByText(/couldn.t be sent/i).waitFor();
      check("honeypot: rejected, with the email offered", (await status(page).locator(`a[href="mailto:${EMAIL}"]`).count()) === 1);
      check("honeypot: nothing reached the webhook", hook.received.length === 0);
      await context.close();
    });

    // ── 5. Valid → success, payload complete ─────────────────────────────────────────────────
    await step("valid submission succeeds", async () => {
      const { context, page } = await newWatchedPage(browser, problems);
      await page.goto(`${BASE}/?from=/work/sabbath-spa`, { waitUntil: "networkidle" });
      await startClock(page);
      const v = await fillValid(page, { company: "=SUM(1,2)", message: "Hello Ehjay,\r\nI'd like to talk about a role.\u0007 Thanks!" });
      await sleep(WAIT_PAST_MIN_FILL);
      const before = Date.now();
      await submit(page).click();
      await status(page).getByText(/thanks, test visitor/i).waitFor();
      check("valid: success message in the live region (role=status)", true);
      const p = hook.received.at(-1);
      check("valid: exactly one payload reached the webhook", hook.received.length === 1, JSON.stringify(hook.received));
      check("valid: payload has every field", p && ["timestamp", "name", "email", "company", "inquiryType", "message", "page"].every((k) => typeof p[k] === "string"), JSON.stringify(p));
      check("valid: values are right (label for inquiry type, cleaned message)",
        p?.name === v.name && p?.email === v.email && p?.company === "=SUM(1,2)" && p?.inquiryType === "Freelance project" &&
        p?.message === "Hello Ehjay,\nI'd like to talk about a role. Thanks!", JSON.stringify(p));
      check("valid: page comes from ?from=", p?.page === "/work/sabbath-spa", p?.page);
      check("valid: timestamp is ISO and current", p && !Number.isNaN(Date.parse(p.timestamp)) && Math.abs(Date.parse(p.timestamp) - before) < 30_000 && p.timestamp.endsWith("Z"), p?.timestamp);
      check("valid: the secret was sent in the body as JSON", p?.contentType.startsWith("application/json"));
      check("valid: the form is cleared after success", (await page.locator("#cf-name").inputValue()) === "" && (await page.locator("#cf-message").inputValue()) === "");
      await context.close();
    });

    // ── 6. Webhook problems → error that offers the email ────────────────────────────────────
    for (const [mode, label] of [["fail", "script answers ok:false"], ["html", "sign-in page instead of JSON"], ["slow", "no answer within 10s"]]) {
      await step(`webhook ${label}`, async () => {
        hook.setMode(mode);
        const before = hook.received.length;
        const { context, page } = await newWatchedPage(browser, problems);
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        await startClock(page);
        const v = await fillValid(page);
        await sleep(WAIT_PAST_MIN_FILL);
        const started = Date.now();
        await submit(page).click();
        await status(page).getByText(/couldn.t be sent/i).waitFor({ timeout: 20_000 });
        const took = Date.now() - started;
        check(`webhook ${label}: error shown with the email`, (await status(page).locator(`a[href="mailto:${EMAIL}"]`).count()) === 1);
        check(`webhook ${label}: values kept`, (await page.locator("#cf-name").inputValue()) === v.name);
        if (mode === "slow") check("webhook timeout: gave up after ~10s", took >= 9_500 && took < 15_000, `${took}ms`);
        if (mode === "fail") check(`webhook ${label}: nothing recorded`, hook.received.length === before);
        hook.setMode("ok");
        await context.close();
      });
    }
    hook.setMode("ok");
    check("no console errors, hydration warnings or failed requests (JS)", problems.length === 0, problems.join("\n      "));

    // ── 7. Without JavaScript ────────────────────────────────────────────────────────────────
    console.log("Without JavaScript:");
    await step("no-JS flow", async () => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const postAndWait = async () => {
        await Promise.all([
          page.waitForResponse((r) => r.request().method() === "POST" && r.url().startsWith(BASE)),
          submit(page).click(),
        ]);
        await page.waitForLoadState("load");
      };

      await page.goto(`${BASE}/`);
      await postAndWait();
      check("no-JS empty submit: inline errors rendered by the server", (await page.locator("#cf-name-error").count()) === 1 && (await page.locator("#cf-message-error").count()) === 1);
      check("no-JS empty submit: first invalid field has aria-invalid and autofocus",
        (await page.locator("#cf-name").getAttribute("aria-invalid")) === "true" && (await page.locator("#cf-name").getAttribute("autofocus")) !== null);
      check("no-JS: the response lands on the form (#contact-form)", page.url().endsWith("#contact-form"), page.url());

      const before = hook.received.length;
      await page.goto(`${BASE}/?from=/now`);
      await fillValid(page, { name: "No Script" });
      await postAndWait();
      const retry = await status(page).innerText();
      check("no-JS first submit: asks to press Send again (no signed start time yet)", /press send again/i.test(retry), retry);
      check("no-JS first submit: values kept", (await page.locator("#cf-name").inputValue()) === "No Script" && (await page.locator("#cf-message").inputValue()).includes("talk about a project"));
      await sleep(WAIT_PAST_MIN_FILL);
      await postAndWait();
      const done = await status(page).innerText();
      check("no-JS second submit: success message", /thanks, no script/i.test(done), done);
      const p = hook.received.at(-1);
      check("no-JS: payload reached the webhook with page from ?from=", hook.received.length === before + 1 && p?.name === "No Script" && p?.page === "/now", JSON.stringify(p));
      await context.close();
    });
  } finally {
    await browser.close();
    await stopServer(server);
    await hook.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (!SKIP_BUILD) console.log("Note: .next now holds a build made with test values; run `pnpm build` before `pnpm start`.");
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
