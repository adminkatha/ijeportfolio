// E2E for the "Let’s connect" pop-up (header, mobile menu, command palette).
//
//   node tests/e2e/dialog.test.mjs                 # builds twice (without, then with the contact env vars), runs everything
//   node tests/e2e/dialog.test.mjs --skip-build    # reuse the current .next (built WITH the contact env vars): part 2 only
//   node tests/e2e/dialog.test.mjs --port 3401     # port for `next start` (default 3401)
//   node tests/e2e/dialog.test.mjs --only "palette"
//   node tests/e2e/dialog.test.mjs --strict        # [after merge] checks count as failures too
//
// Checks marked [after merge] need the contact form's dialog variant (preselected "Hire full-time" with a letter,
// the success panel with its Close button and data-contact-sent). Until that lands they are reported, not failed;
// --strict makes them count.
// Needs the local Chrome. Leaves .next built with test values: run `pnpm build` again before `pnpm start` or a deploy.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { harness } from "./_harness.mjs";
import { startFakeWebhook } from "./fake-webhook.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const PART = option("part", null); // set when this file runs itself for part 1
const SKIP_BUILD = args.includes("--skip-build") || PART !== null;
const STRICT = args.includes("--strict");
const EMAIL = "ehjaylorenzo2@gmail.com";
const NEXT = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const WAIT_PAST_MIN_FILL = 3_300;
const UNCONFIGURED = { CONTACT_WEBHOOK_URL: "", CONTACT_SECRET: "" };

const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function runNext(nextArgs, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT, ...nextArgs], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    child.on("exit", (code) => (code === 0 ? resolve(log) : reject(new Error(`next ${nextArgs.join(" ")} failed (${code}):\n${log.slice(-3000)}`))));
  });
}

/** Runs this file again for part 1 (its own `next start`, without the env vars); resolves with its exit code. */
function runPart(part) {
  const passThrough = args.filter((a, i) => a !== "--skip-build" && args[i - 1] !== "--part" && a !== "--part");
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "--part", part, ...passThrough], {
      env: { ...process.env, ...UNCONFIGURED },
      stdio: "inherit",
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

// ── Orchestration: part 1 (no env vars → "Email me instead"), then part 2 (the form, against the fake webhook) ──
let fallbackExit = 0;
let hook = null;
if (PART === null) {
  const secret = `test-${randomBytes(16).toString("hex")}`;
  hook = await startFakeWebhook({ secret });
  if (!SKIP_BUILD) {
    console.log("Building without CONTACT_* …");
    await runNext(["build"], UNCONFIGURED);
    console.log("\nPart 1: not configured");
    fallbackExit = await runPart("fallback");
    console.log("\nBuilding with CONTACT_* pointing at the fake webhook …");
    await runNext(["build"], { CONTACT_WEBHOOK_URL: hook.url, CONTACT_SECRET: secret });
  }
  console.log("\nPart 2: the form");
  // `next start` (started by the harness) inherits these: the server action posts to the fake webhook.
  process.env.CONTACT_WEBHOOK_URL = hook.url;
  process.env.CONTACT_SECRET = secret;
}

const t = await harness();

// ── Helpers ────────────────────────────────────────────────────────────────────────────────────────────────

const dialog = (page) => page.getByRole("dialog", { name: "Let’s connect" });
const headerLink = (page) => page.locator("header").getByRole("link", { name: "Let’s connect" });

async function load(route, options = DESKTOP) {
  const { context, page } = await t.newPage(options);
  await page.goto(`${t.baseUrl}${route}`, { waitUntil: "networkidle" });
  return { context, page };
}

/** Waits for the dialog to be open and its open animation (if any) to finish. */
async function opened(page) {
  await dialog(page).waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const d = document.querySelector("dialog[aria-labelledby='contact-dialog-title']");
    return d?.open && d.getAnimations({ subtree: false }).every((a) => a.playState !== "running");
  });
}

async function closed(page) {
  await dialog(page).waitFor({ state: "hidden" });
  // Focus is handed back once the close event has landed.
  await page.waitForFunction(() => !document.querySelector("dialog[aria-labelledby='contact-dialog-title']")?.open);
  await page.waitForTimeout(50);
}

/** The dialog and where focus is. */
const state = (page) =>
  page.evaluate(() => {
    const d = document.querySelector("dialog[aria-labelledby='contact-dialog-title']");
    const a = document.activeElement;
    const box = d?.getBoundingClientRect();
    return {
      open: !!d?.open,
      modal: !!d?.matches(":modal"),
      focusInside: !!(d && a && d.contains(a)),
      active: a ? { tag: a.tagName, id: a.id, name: a.getAttribute("name"), text: (a.textContent ?? "").trim().slice(0, 40), controls: a.getAttribute("aria-controls") } : null,
      activeInHeader: !!a?.closest("header"),
      box: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      // The page's own area: the scrollbar's gutter stays reserved while the dialog is open (scrollbar-gutter: stable).
      viewport: { width: document.body.clientWidth, height: document.documentElement.clientHeight },
      url: location.href,
      scrollY,
    };
  });

/** [after merge] checks: printed as they go; they fail the test only with --strict. */
function afterMerge() {
  const failed = [];
  return {
    check(name, ok, detail = "") {
      console.log(`    ${ok ? "✓" : "○"} [after merge] ${name}${ok ? "" : ` (not yet${detail ? `: ${detail}` : ""})`}`);
      if (!ok) failed.push(name);
    },
    done() {
      if (STRICT && failed.length) throw new Error(`[after merge] checks failed: ${failed.join("; ")}`);
    },
  };
}

async function axe(page) {
  const result = await new AxeBuilder({ page }).withTags(AXE_TAGS).exclude("iframe").analyze();
  return result.violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

// ── Part 1: not configured → "Email me instead" in the pop-up ─────────────────────────────────────────────

if (PART === "fallback") {
  t.test("not configured: the pop-up shows “Email me instead” under its heading; focus on the heading; Esc returns focus", async () => {
    const { context, page } = await load("/");
    await headerLink(page).click();
    await opened(page);
    const fallback = dialog(page).locator("[data-contact-fallback]");
    assert.match(await fallback.innerText(), /email me instead/i);
    assert.equal(await fallback.locator(`a[href="mailto:${EMAIL}"]`).count(), 1, "mailto link");
    assert.equal(await dialog(page).locator("form").count(), 0, "no form in the pop-up");
    const heading = dialog(page).getByRole("heading", { name: "Let’s connect" });
    assert.ok(await heading.isVisible());
    const s = await state(page);
    assert.ok(s.modal, "opened with showModal");
    assert.ok(s.focusInside && s.active.id === "contact-dialog-title", `focus on the heading (${JSON.stringify(s.active)})`);
    assert.ok(s.box.height < 320 && Math.abs(s.box.y + s.box.height / 2 - s.viewport.height / 2) <= 2, `a centred panel that hugs its content (${JSON.stringify(s.box)})`);
    await page.keyboard.press("Escape");
    await closed(page);
    const after = await state(page);
    assert.ok(after.activeInHeader && /connect/i.test(after.active.text), `focus back on the header link (${JSON.stringify(after.active)})`);
    await context.close();
  });

  t.test("not configured: same fallback on a phone (full screen, from the menu)", async () => {
    const { context, page } = await load("/work", MOBILE);
    await page.getByRole("button", { name: "Menu" }).tap();
    await page.locator("#mobile-menu").getByRole("link", { name: "Let’s connect" }).tap();
    await opened(page);
    assert.match(await dialog(page).locator("[data-contact-fallback]").innerText(), /email me instead/i);
    const s = await state(page);
    assert.ok(Math.abs(s.box.width - s.viewport.width) <= 1 && Math.abs(s.box.height - s.viewport.height) <= 1, `full screen (${JSON.stringify(s.box)})`);
    assert.equal(new URL(s.url).pathname, "/work", "opened in place");
    await context.close();
  });

  t.test("not configured: axe finds 0 violations with the pop-up open", async () => {
    for (const device of [DESKTOP, MOBILE]) {
      const { context, page } = await load("/", device);
      if (device === MOBILE) {
        await page.getByRole("button", { name: "Menu" }).tap();
        await page.locator("#mobile-menu").getByRole("link", { name: "Let’s connect" }).tap();
      } else {
        await headerLink(page).click();
      }
      await opened(page);
      const violations = await axe(page);
      assert.deepEqual(violations, [], `@${device.viewport.width}: ${violations.join("\n      ")}`);
      await context.close();
    }
  });
}

// ── Part 2: configured → the form ─────────────────────────────────────────────────────────────────────────

if (PART === null) {
  t.test("desktop header: opens in place on /, a modal dialog named “Let’s connect”, focus in Name", async () => {
    const { context, page } = await load("/");
    const link = headerLink(page);
    assert.equal(await link.getAttribute("href"), "/#contact");
    assert.equal(await link.getAttribute("aria-haspopup"), "dialog");
    await link.click();
    await opened(page);
    assert.equal(await dialog(page).count(), 1, "role=dialog with the accessible name “Let’s connect”");
    assert.equal(await dialog(page).getAttribute("aria-labelledby"), "contact-dialog-title");
    assert.ok(await dialog(page).getByRole("heading", { name: "Let’s connect" }).isVisible(), "visible heading");
    const s = await state(page);
    assert.ok(s.modal, "showModal (aria-modal semantics, page inert)");
    assert.ok(s.focusInside && s.active.name === "name", `focus in the Name field (${JSON.stringify(s.active)})`);
    assert.equal(s.url, `${t.baseUrl}/`, "URL unchanged");
    assert.equal(await dialog(page).locator("form#contact-dialog-form").count(), 1, "the form, not the fallback");
    assert.equal(await dialog(page).locator("[data-contact-fallback]").count(), 0);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), "hidden", "the page behind doesn't scroll");
    await context.close();
  });

  t.test("Tab and Shift+Tab stay inside (the page behind is inert)", async () => {
    const { context, page } = await load("/");
    await headerLink(page).click();
    await opened(page);
    for (const key of ["Tab", "Shift+Tab"]) {
      const seen = new Set();
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press(key);
        const s = await state(page);
        assert.ok(s.focusInside || s.active?.tag === "BODY", `${key} ${i + 1}: focus left the dialog (${JSON.stringify(s.active)})`);
        if (s.focusInside) seen.add(`${s.active.tag}#${s.active.id}`);
      }
      assert.ok(seen.size >= 5, `${key} reaches the dialog's controls (${[...seen].join(", ")})`);
    }
    await context.close();
  });

  t.test("Esc closes it and focus returns to the header button; so does Close", async () => {
    const { context, page } = await load("/");
    await headerLink(page).click();
    await opened(page);
    await page.keyboard.press("Escape");
    await closed(page);
    let s = await state(page);
    assert.ok(s.activeInHeader && s.active.tag === "A" && /connect/i.test(s.active.text), `Esc: focus on the header link (${JSON.stringify(s.active)})`);
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), "hidden", "scrolling is back");
    await headerLink(page).click();
    await opened(page);
    await dialog(page).getByRole("button", { name: "Close", exact: true }).first().click();
    await closed(page);
    s = await state(page);
    assert.ok(s.activeInHeader && /connect/i.test(s.active.text), `Close: focus on the header link (${JSON.stringify(s.active)})`);
    // Keyboard: Enter on the focused link reopens it.
    await page.keyboard.press("Enter");
    await opened(page);
    assert.ok((await state(page)).focusInside);
    // A text selection dragged out of a field onto the backdrop doesn't close it; a click on the backdrop does.
    const field = await page.locator("#cd-company").boundingBox();
    await page.mouse.move(field.x + 20, field.y + field.height / 2);
    await page.mouse.down();
    await page.mouse.move(60, 450, { steps: 5 });
    await page.mouse.up();
    assert.ok((await state(page)).open, "still open after a drag out to the backdrop");
    await page.mouse.click(60, 450);
    await closed(page);
    s = await state(page);
    assert.ok(s.activeInHeader && /connect/i.test(s.active.text), `backdrop: focus on the header link (${JSON.stringify(s.active)})`);
    await context.close();
  });

  t.test("typed text survives closing and reopening", async () => {
    const { context, page } = await load("/");
    await headerLink(page).click();
    await opened(page);
    await page.locator("#cd-name").fill("Kept Name");
    await page.locator("#cd-message").fill("Kept message, long enough to count.");
    await page.keyboard.press("Escape");
    await closed(page);
    await headerLink(page).click();
    await opened(page);
    assert.equal(await page.locator("#cd-name").inputValue(), "Kept Name");
    assert.equal(await page.locator("#cd-message").inputValue(), "Kept message, long enough to count.");
    await context.close();
  });

  t.test("on /work and a project page it opens in place (URL unchanged)", async () => {
    for (const route of ["/work", "/work/honey-tribe"]) {
      const { context, page } = await load(route);
      assert.equal(await headerLink(page).getAttribute("href"), `/?from=${encodeURIComponent(route)}#contact`);
      await headerLink(page).click();
      await opened(page);
      const s = await state(page);
      assert.equal(s.url, `${t.baseUrl}${route}`, `${route}: URL unchanged`);
      assert.ok(s.focusInside, `${route}: focus inside`);
      await page.keyboard.press("Escape");
      await closed(page);
      await context.close();
    }
  });

  t.test("a send from a project page reaches the webhook (the lazily loaded form's server actions work there)", async () => {
    const later = afterMerge();
    const { context, page } = await load("/work/honey-tribe");
    await headerLink(page).click();
    await opened(page);
    const form = page.locator("#contact-dialog-form");
    const hire = form.getByRole("radio", { name: "Hire full-time" });
    later.check("“Hire full-time” is preselected", await hire.isChecked());
    const letter = await page.locator("#cd-message").inputValue();
    later.check("the hiring letter is in the message box", letter.trim().length >= 40, JSON.stringify(letter.slice(0, 60)));

    // The Name field has focus, which starts the form's signed clock.
    await page.waitForFunction(() => document.querySelector("#contact-dialog-form input[name=t]")?.value.length > 10, null, { timeout: 10_000 });
    await page.locator("#cd-name").fill("Dialog Visitor");
    await page.locator("#cd-email").fill("dialog@example.com");
    await hire.check();
    if ((await page.locator("#cd-message").inputValue()).trim().length < 10) await page.locator("#cd-message").fill("Hello Ehjay,\nWe'd like to talk about a role.");
    await sleep(WAIT_PAST_MIN_FILL);
    const before = hook.received.length;
    await form.locator("button[type=submit]").click();
    const start = Date.now();
    while (hook.received.length === before && Date.now() - start < 15_000) await sleep(100);
    const p = hook.received.at(-1);
    assert.equal(hook.received.length, before + 1, "one payload reached the webhook");
    assert.equal(p.page, "/work/honey-tribe", "page = where the pop-up was opened");
    assert.equal(p.name, "Dialog Visitor");
    assert.equal(p.inquiryType, "Hire full-time");

    const sent = dialog(page).locator("[data-contact-sent]");
    const shown = await sent.waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false);
    const text = shown ? await sent.innerText() : await page.locator("#contact-dialog-form [role=status]").innerText().catch(() => "");
    later.check("success: “Thanks, your message is on its way to Ehjay. He'll reply to …”", shown && /Thanks, your message is on its way to Ehjay\. He.ll reply to dialog@example\.com/.test(text), JSON.stringify(text.slice(0, 90)));
    const sentClose = sent.getByRole("button", { name: "Close" });
    const hasClose = shown && (await sentClose.count()) === 1;
    later.check("success: with a Close button", hasClose);
    if (hasClose) await sentClose.click();
    else await page.keyboard.press("Escape");
    await closed(page);
    const s = await state(page);
    assert.ok(s.activeInHeader && /connect/i.test(s.active.text), `focus back on the header link (${JSON.stringify(s.active)})`);

    await headerLink(page).click();
    await opened(page);
    const fresh = {
      sentPanel: await dialog(page).locator("[data-contact-sent]").count(),
      name: await page.locator("#cd-name").inputValue().catch(() => null),
      status: (await page.locator("#contact-dialog-form [role=status]").innerText().catch(() => "")).trim(),
      hire: await hire.isChecked().catch(() => false),
    };
    later.check("reopening after a send shows a fresh form", fresh.sentPanel === 0 && fresh.name === "" && fresh.status === "" && fresh.hire, JSON.stringify(fresh));
    await context.close();
    later.done();
  });

  t.test("mobile 390: Menu → Let’s connect → full-screen dialog; Close → focus on the Menu button", async () => {
    const { context, page } = await load("/", MOBILE);
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.tap();
    await page.locator("#mobile-menu").getByRole("link", { name: "Let’s connect" }).tap();
    await opened(page);
    let s = await state(page);
    assert.ok(Math.abs(s.box.x) <= 1 && Math.abs(s.box.y) <= 1, `at the top left (${JSON.stringify(s.box)})`);
    assert.ok(Math.abs(s.box.width - s.viewport.width) <= 1 && Math.abs(s.box.height - s.viewport.height) <= 1, `full screen (${JSON.stringify(s.box)} vs ${JSON.stringify(s.viewport)})`);
    assert.ok(s.focusInside, `focus inside (${JSON.stringify(s.active)})`);
    assert.equal(await menu.getAttribute("aria-expanded"), "false", "the menu closed");
    assert.equal(s.url, `${t.baseUrl}/`, "URL unchanged");
    await dialog(page).getByRole("button", { name: "Close", exact: true }).first().tap();
    await closed(page);
    s = await state(page);
    assert.equal(s.active?.controls, "mobile-menu", `focus on the Menu button (${JSON.stringify(s.active)})`);
    await context.close();
  });

  t.test("desktop: a centred panel narrower than the viewport", async () => {
    const { context, page } = await load("/");
    await headerLink(page).click();
    await opened(page);
    const s = await state(page);
    const { box, viewport } = s;
    assert.ok(box.width < viewport.width - 100 && Math.abs(box.width - 640) <= 2, `about 40rem wide (${box.width})`);
    assert.ok(Math.abs(box.x + box.width / 2 - viewport.width / 2) <= 2, `centred horizontally (${JSON.stringify(box)})`);
    assert.ok(Math.abs(box.y + box.height / 2 - viewport.height / 2) <= 2, `centred vertically (${JSON.stringify(box)})`);
    assert.ok(box.height <= viewport.height * 0.9 + 1, `at most 90dvh tall (${box.height})`);
    await context.close();
  });

  t.test("palette: Ctrl+K, “hire”, Enter opens it; Esc returns focus to the ⌘K button", async () => {
    const { context, page } = await load("/");
    await page.keyboard.press("Control+k");
    await page.getByRole("dialog", { name: "Command menu" }).waitFor({ state: "visible" });
    await page.keyboard.type("hire");
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.querySelector('[cmdk-item][aria-selected="true"]')?.firstChild?.textContent), "Let’s connect");
    await page.keyboard.press("Enter");
    await page.getByRole("dialog", { name: "Command menu" }).waitFor({ state: "hidden" });
    await opened(page);
    let s = await state(page);
    assert.ok(s.focusInside, `focus inside (${JSON.stringify(s.active)})`);
    assert.equal(s.url, `${t.baseUrl}/`, "URL unchanged");
    await page.keyboard.press("Escape");
    await closed(page);
    s = await state(page);
    assert.ok(s.activeInHeader && /Jump to/.test(s.active.text), `focus on the ⌘K button (${JSON.stringify(s.active)})`);
    await context.close();
  });

  t.test("ids stay unique on the homepage with the pop-up open (two forms on the page)", async () => {
    const { context, page } = await load("/");
    await headerLink(page).click();
    await opened(page);
    const ids = await page.evaluate(() => [...document.querySelectorAll("[id]")].map((el) => el.id));
    const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    assert.deepEqual(duplicates, [], "no duplicate ids");
    assert.ok(ids.includes("contact-form") && ids.includes("contact-dialog-form"), "both forms are on the page");
    await context.close();
  });

  t.test("axe finds 0 violations with the pop-up open (1440 and 390)", async () => {
    for (const device of [DESKTOP, MOBILE]) {
      const { context, page } = await load("/", device);
      if (device === MOBILE) {
        await page.getByRole("button", { name: "Menu" }).tap();
        await page.locator("#mobile-menu").getByRole("link", { name: "Let’s connect" }).tap();
      } else {
        await headerLink(page).click();
      }
      await opened(page);
      const violations = await axe(page);
      assert.deepEqual(violations, [], `@${device.viewport.width}: ${violations.join("\n      ")}`);
      await context.close();
    }
  });

  t.test("desktop with Lenis on: the wheel scrolls the dialog, not the page", async () => {
    // A shorter window, so the form overflows the panel.
    const { context, page } = await load("/", { viewport: { width: 1280, height: 640 } });
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"), null, { timeout: 10_000 });
    await headerLink(page).click();
    await opened(page);
    const scroller = await page.evaluateHandle(() =>
      [...document.querySelectorAll("dialog[aria-labelledby='contact-dialog-title'] *")].find((el) => getComputedStyle(el).overflowY === "auto"),
    );
    const room = await scroller.evaluate((el) => el.scrollHeight - el.clientHeight);
    assert.ok(room > 100, `the dialog's content overflows (${room}px)`);
    const box = await dialog(page).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.6);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 240);
    await page.waitForTimeout(800);
    const inside = await scroller.evaluate((el) => el.scrollTop);
    assert.ok(inside > 100, `the dialog scrolled (${inside}px)`);
    assert.equal(await page.evaluate(() => scrollY), 0, "the page didn't");
    // Over the backdrop: nothing moves.
    await page.mouse.move(40, 320);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 240);
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => scrollY), 0, "the page didn't scroll under the backdrop");
    // Closed: the page scrolls again (through Lenis).
    await page.keyboard.press("Escape");
    await closed(page);
    await page.mouse.move(640, 320);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 240);
    await page.waitForTimeout(1000);
    assert.ok((await page.evaluate(() => scrollY)) > 100, "the page scrolls once it's closed");
    await context.close();
  });

  t.test("motion: an open animation with motion on; none when it's reduced (OS setting or saved choice)", async () => {
    const animation = async (options, init) => {
      const { context, page } = await t.newPage({ ...DESKTOP, ...options });
      if (init) await page.addInitScript(init);
      await page.goto(`${t.baseUrl}/`, { waitUntil: "networkidle" });
      await headerLink(page).click();
      await dialog(page).waitFor({ state: "visible" });
      const name = await dialog(page).evaluate((d) => getComputedStyle(d).animationName);
      await context.close();
      return name;
    };
    assert.match(await animation({}), /dialogIn/);
    assert.equal(await animation({ reducedMotion: "reduce" }), "none");
    assert.equal(await animation({}, () => localStorage.setItem("motion", "reduced")), "none");
  });

  t.test("without JavaScript the header link is a plain link to /#contact", async () => {
    for (const [route, href] of [["/", "/#contact"], ["/work", "/?from=%2Fwork#contact"]]) {
      const { context, page } = await load(route, { ...DESKTOP, javaScriptEnabled: false });
      const link = headerLink(page);
      assert.equal(await link.getAttribute("href"), href);
      assert.equal(await link.getAttribute("aria-haspopup"), null, "not announced as a pop-up without the script");
      await link.click();
      await page.waitForURL(`${t.baseUrl}${href}`);
      assert.equal(await page.locator("#contact").count(), 1, "lands on the Contact section");
      assert.equal(await page.locator("dialog[aria-labelledby='contact-dialog-title']").count(), 0, "no pop-up");
      await context.close();
    }
  });
}

if (PART === null && fallbackExit !== 0) {
  t.test("part 1 (not configured) passed", async () => {
    assert.fail(`part 1 exited with ${fallbackExit} (see its output above)`);
  });
}

await t.run();
