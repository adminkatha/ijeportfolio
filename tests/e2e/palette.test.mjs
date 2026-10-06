// E2E for the command palette (phase 12).
// Run after `pnpm build`:   node tests/e2e/palette.test.mjs     (starts `next start -p 3401` itself)
// Or against a server:      node tests/e2e/palette.test.mjs --url http://localhost:3401

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { harness } from "./_harness.mjs";

const t = await harness();
const DESKTOP = { viewport: { width: 1440, height: 900 } };

async function open(options = DESKTOP) {
  const { context, page } = await t.newPage(options);
  const scripts = [];
  page.on("request", (req) => {
    if (req.resourceType() === "script") scripts.push(new URL(req.url()).pathname);
  });
  await page.goto(`${t.baseUrl}/`, { waitUntil: "networkidle" });
  return { context, page, scripts };
}

/** The built chunks that contain cmdk (read from .next on disk, so this runs against a local build). */
function cmdkChunks() {
  const dir = path.join(process.cwd(), ".next", "static", "chunks");
  return readdirSync(dir).filter((f) => f.endsWith(".js") && readFileSync(path.join(dir, f), "utf8").includes("cmdk-input"));
}

const dialog = (page) => page.getByRole("dialog", { name: "Command menu" });
const active = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    // A rough accessible name: aria-label, the labelling element, or the text that isn't aria-hidden.
    const labelledBy = el?.getAttribute("aria-labelledby");
    const visibleText = el ? [...el.childNodes].filter((n) => !(n instanceof Element && n.getAttribute("aria-hidden") === "true")).map((n) => n.textContent).join("").trim() : "";
    const label = el?.getAttribute("aria-label") ?? (labelledBy ? document.getElementById(labelledBy)?.textContent : visibleText);
    return { tag: el?.tagName, label, inDialog: !!el?.closest("dialog") };
  });

t.test("cmdk is not in the JavaScript that / loads before any interaction", async () => {
  const chunks = cmdkChunks();
  assert.ok(chunks.length > 0, "the build has a cmdk chunk");
  const { context, page, scripts } = await open();
  await page.waitForTimeout(1500);
  assert.ok(scripts.length > 0, "scripts were loaded");
  const early = scripts.filter((p) => chunks.some((c) => p.endsWith(`/${c}`)));
  assert.deepEqual(early, [], "no cmdk chunk is requested before interaction");
  // It arrives on demand: hovering the button prefetches it.
  const request = page.waitForRequest((req) => chunks.some((c) => req.url().endsWith(`/${c}`)), { timeout: 10_000 });
  await page.getByRole("button", { name: /Jump to/ }).hover();
  await request;
  await context.close();
});

t.test("⌘K / Ctrl+K opens it with the labelled input focused; Esc closes and returns focus", async () => {
  const { context, page } = await open();
  const cta = page.locator("h1 ~ div a").first();
  await cta.focus();
  for (const combo of ["Control+k", "Meta+k"]) {
    await page.keyboard.press(combo);
    await dialog(page).waitFor({ state: "visible" });
    const focused = await active(page);
    assert.equal(focused.tag, "INPUT");
    assert.equal(focused.label, "Search commands");
    assert.equal(await page.getByRole("combobox", { name: "Search commands" }).count(), 1);
    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
    const back = await active(page);
    assert.equal(back.tag, "A", `${combo}: focus returns to the element that had it`);
  }
  await context.close();
});

t.test("Esc then ⌘K straight away reopens it (no race with the dialog's close event)", async () => {
  const { context, page } = await open();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Control+k");
    await dialog(page).waitFor({ state: "visible", timeout: 5000 });
    await page.keyboard.press("Escape");
    await page.keyboard.press("Control+k"); // no wait in between
    await dialog(page).waitFor({ state: "visible", timeout: 5000 });
    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }
  await context.close();
});

t.test("the header button opens it; focus is trapped; Esc returns focus to the button", async () => {
  const { context, page } = await open();
  const button = page.getByRole("button", { name: /Jump to/ });
  assert.equal(await button.getAttribute("aria-haspopup"), "dialog");
  await button.click();
  await dialog(page).waitFor({ state: "visible" });
  assert.equal(await button.getAttribute("aria-expanded"), "true");
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const focused = await active(page);
    assert.ok(focused.inDialog || focused.tag === "BODY" || focused.tag === undefined, `Tab ${i + 1} stays out of the page behind (${focused.tag})`);
  }
  await page.keyboard.press("Escape");
  await dialog(page).waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.querySelector('[aria-haspopup="dialog"]')?.getAttribute("aria-expanded") === "false");
  assert.equal((await active(page)).label, "Jump to");
  await context.close();
});

t.test("groups Navigate / Work / Links / Actions; placeholders are left out", async () => {
  const { context, page } = await open();
  await page.keyboard.press("Control+k");
  await dialog(page).waitFor({ state: "visible" });
  const headings = await page.locator("[cmdk-group-heading]").allTextContents();
  assert.deepEqual(headings, ["Navigate", "Work", "Links", "Actions"]);
  const labels = await page.getByRole("option").allTextContents();
  for (const expected of ["Home", "Selected work", "All work", "Honey Tribe", "Email", "Copy email address", "Toggle motion", "Hire me"]) {
    assert.ok(labels.some((l) => l.startsWith(expected)), `has "${expected}"`);
  }
  assert.ok(!labels.some((l) => /LinkedIn|résumé|FILL IN/i.test(l)), "no fillIn links, no résumé until there is a file");
  // The accent marks the selected item only.
  const marker = await page.evaluate(() => {
    const sel = document.querySelector('[cmdk-item][data-selected="true"]');
    return sel ? getComputedStyle(sel, "::before").backgroundColor : null;
  });
  assert.equal(marker, "rgb(197, 248, 42)");
  await context.close();
});

t.test("search ranks real matches first (no scattered-letter matches)", async () => {
  const { context, page } = await open();
  await page.keyboard.press("Control+k");
  const first = async (query) => {
    await page.getByRole("combobox").fill(query);
    await page.waitForTimeout(150);
    return page.evaluate(() => ({
      selected: document.querySelector('[cmdk-item][aria-selected="true"]')?.firstChild?.textContent,
      all: [...document.querySelectorAll("[cmdk-item]")].map((i) => i.firstChild?.textContent),
    }));
  };
  assert.deepEqual((await first("toggle")).all, ["Toggle motion"]);
  assert.equal((await first("copy")).selected, "Copy email address");
  assert.equal((await first("honey")).selected, "Honey Tribe");
  assert.equal((await first("hire")).selected, "Hire me");
  assert.ok((await first("web")).all.length >= 3, "discipline hints are searchable");
  const none = await first("zzzz");
  assert.deepEqual(none.all, []);
  assert.match(await page.locator("[cmdk-empty]").textContent(), /Nothing matches/);
  await context.close();
});

t.test("search + Enter navigates in-page (with the header offset) and focus moves to the section", async () => {
  const { context, page } = await open();
  await page.keyboard.press("Control+k");
  await page.keyboard.type("selected work");
  await page.keyboard.press("Enter");
  await dialog(page).waitFor({ state: "hidden" });
  await page.waitForFunction(() => location.hash === "#work");
  await page.waitForTimeout(1200);
  const where = await page.evaluate(() => ({ top: document.getElementById("work").getBoundingClientRect().top, focused: document.activeElement?.id }));
  assert.equal(where.focused, "work");
  assert.ok(Math.abs(where.top - 80) < 4, `section sits below the 80px header offset (${where.top})`);
  await context.close();
});

t.test("copy email: clipboard + polite live-region confirmation", async () => {
  const { context, page } = await open();
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: t.baseUrl });
  const button = page.getByRole("button", { name: /Jump to/ });
  await button.click();
  await page.keyboard.type("copy email");
  await page.keyboard.press("Enter");
  await dialog(page).waitFor({ state: "hidden" });
  const status = page.getByRole("status");
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes("copied"));
  assert.equal(await status.textContent(), "Email address copied: ehjaylorenzo2@gmail.com");
  assert.equal(await status.getAttribute("aria-live"), null, "role=status is polite by default");
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "ehjaylorenzo2@gmail.com");
  assert.equal((await active(page)).label, "Jump to", "focus back on the opener");
  await context.close();
});

t.test("toggle motion: applies at once, is announced, and persists", async () => {
  const { context, page } = await open();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "full");
  await page.keyboard.press("Control+k");
  await page.keyboard.type("toggle motion");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.dataset.motion === "reduced");
  assert.equal(await page.getByRole("status").textContent(), "Motion reduced");
  assert.equal(await page.evaluate(() => localStorage.getItem("motion")), "reduced");
  assert.equal(await page.locator('section[aria-labelledby="hero-title"]').getAttribute("data-mode"), "drag", "the seam stops following the cursor");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "reduced", "set before paint on the next load");
  await page.keyboard.press("Control+k");
  await page.keyboard.type("toggle motion");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.dataset.motion === "full");
  assert.equal(await page.evaluate(() => localStorage.getItem("motion")), "full");
  await context.close();
});

t.test("a click on the backdrop closes it", async () => {
  const { context, page } = await open();
  await page.keyboard.press("Control+k");
  await dialog(page).waitFor({ state: "visible" });
  await page.mouse.click(20, 880);
  await dialog(page).waitFor({ state: "hidden" });
  await context.close();
});

await t.run();
