// E2E for motion (phase 14): reveal-once, Lenis desktop-only with an idle-stopping loop, the motion
// preference, and content visible without JavaScript.
// Run after `pnpm build`:   node tests/e2e/motion.test.mjs     (starts `next start -p 3401` itself)
// Or against a server:      node tests/e2e/motion.test.mjs --url http://localhost:3401

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { harness } from "./_harness.mjs";

const t = await harness();
const DESKTOP = { viewport: { width: 1440, height: 900 } };

const countFrames = () => {
  window.__raf = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    window.__raf++;
    return raf(cb);
  };
};

async function open(options = DESKTOP) {
  const { context, page } = await t.newPage(options);
  const scripts = [];
  page.on("request", (req) => req.resourceType() === "script" && scripts.push(new URL(req.url()).pathname));
  await page.addInitScript(countFrames);
  await page.goto(`${t.baseUrl}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  return { context, page, scripts };
}

const lenisOn = (page) => page.evaluate(() => document.documentElement.classList.contains("lenis"));
const frames = (page) => page.evaluate(() => window.__raf);
async function idleFrames(page, ms = 1000) {
  const before = await frames(page);
  await page.waitForTimeout(ms);
  return (await frames(page)) - before;
}
/** Waits until no frame has been requested for 300ms. */
async function settle(page) {
  for (let i = 0; i < 20; i++) {
    if ((await idleFrames(page, 300)) === 0) return;
  }
  throw new Error("never settled");
}

const reveals = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-reveal]")].map((el) => ({
      revealed: el.hasAttribute("data-revealed"),
      opacity: Number(getComputedStyle(el).opacity),
      top: el.getBoundingClientRect().top,
    })),
  );

t.test("content is fully visible without JavaScript", async () => {
  const { context, page } = await t.newPage({ ...DESKTOP, javaScriptEnabled: false });
  await page.goto(`${t.baseUrl}/`, { waitUntil: "load" });
  const all = await reveals(page);
  assert.ok(all.length > 0, "the page has reveal blocks");
  assert.ok(all.every((r) => r.opacity === 1), "every block is visible");
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("js")), false);
  await context.close();
});

t.test("reveal once: hidden below the fold, shown on entry, never hidden again", async () => {
  const { context, page } = await open();
  const before = await reveals(page);
  const below = before.filter((r) => r.top > 900);
  assert.ok(below.length > 0 && below.every((r) => !r.revealed && r.opacity === 0), "blocks below the fold wait");
  await page.evaluate(() => document.querySelector("[data-reveal]").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(900);
  const first = (await reveals(page))[0];
  assert.ok(first.revealed && first.opacity === 1, "revealed on entry (450ms)");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  assert.ok((await reveals(page))[0].revealed, "stays revealed after scrolling away");
  await context.close();
});

t.test("a jump past blocks (End key) still shows them once you scroll back", async () => {
  const { context, page } = await open();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); // one jump to the end
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const all = await reveals(page);
  assert.ok(all.every((r) => r.revealed), `every block passed over is revealed (${all.map((r) => (r.revealed ? "R" : "-")).join("")})`);
  await context.close();
});

t.test("reduced motion: everything visible at once, no Lenis", async () => {
  const { context, page } = await open({ ...DESKTOP, reducedMotion: "reduce" });
  const all = await reveals(page);
  assert.ok(all.every((r) => r.revealed && r.opacity === 1), "nothing waits for a scroll");
  assert.equal(await lenisOn(page), false);
  await context.close();
});

t.test("Lenis on desktop only: fine pointer ≥1024 yes; touch, narrow or reduced no; resize both ways", async () => {
  const desktop = await open();
  assert.equal(await lenisOn(desktop.page), true, "1440 with a mouse");
  await desktop.page.setViewportSize({ width: 900, height: 900 });
  await desktop.page.waitForTimeout(200);
  assert.equal(await lenisOn(desktop.page), false, "torn down under 1024");
  await desktop.page.setViewportSize({ width: 1440, height: 900 });
  await desktop.page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await desktop.context.close();

  const touch = await open({ viewport: { width: 1280, height: 800 }, isMobile: true, hasTouch: true });
  assert.equal(await lenisOn(touch.page), false, "a coarse pointer gets native scrolling");
  await touch.context.close();
});

t.test("Lenis is loaded on demand (not in the initial chunks of a phone)", async () => {
  const dir = path.join(process.cwd(), ".next", "static", "chunks");
  const lenisChunks = readdirSync(dir).filter((f) => f.endsWith(".js") && readFileSync(path.join(dir, f), "utf8").includes("lenisVersion"));
  assert.ok(lenisChunks.length > 0, "the build has a Lenis chunk");
  const { context, scripts } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  assert.deepEqual(scripts.filter((p) => lenisChunks.some((c) => p.endsWith(`/${c}`))), [], "never requested on touch");
  await context.close();
});

t.test("zero idle frames: at rest, and again once a smooth wheel scroll ends", async () => {
  const { context, page } = await open();
  await settle(page);
  assert.equal(await idleFrames(page), 0, "at rest after load");
  await page.mouse.move(700, 400);
  const start = await frames(page);
  await page.mouse.wheel(0, 700);
  const ys = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(50);
    ys.push(await page.evaluate(() => scrollY));
  }
  assert.ok((await frames(page)) > start, "the loop runs while Lenis animates");
  assert.ok(ys.some((y) => y > 0 && y < 700), `eased, not jumped (${ys.join(", ")})`);
  await settle(page);
  assert.equal(await page.evaluate(() => scrollY), 700);
  assert.equal(await idleFrames(page), 0, "asleep again");
  await context.close();
});

t.test("anchor links work with Lenis: in-page target lands below the ~80px header, focus follows", async () => {
  const { context, page } = await open();
  // The hero CTA (href="#work"). Its centre sits on the seam, so click inside its CREATIVE half.
  const box = await page.locator("h1 ~ div a").first().boundingBox();
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height / 2);
  await page.waitForFunction(() => location.hash === "#work");
  await settle(page);
  const where = await page.evaluate(() => ({ top: document.getElementById("work").getBoundingClientRect().top, focused: document.activeElement?.id, pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80 }));
  assert.ok(Math.abs(where.top - where.pad) < 3, `lands at the header offset (${where.top} vs ${where.pad})`);
  assert.equal(where.focused, "work");
  await context.close();
});

t.test("the motion toggle takes effect immediately and persists", async () => {
  const { context, page } = await open();
  assert.equal(await lenisOn(page), true);
  await page.keyboard.press("Control+k");
  await page.getByRole("dialog", { name: "Command menu" }).waitFor();
  await page.keyboard.type("toggle motion");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.dataset.motion === "reduced");
  assert.equal(await lenisOn(page), false, "Lenis torn down at once");
  assert.ok((await reveals(page)).every((r) => r.revealed), "waiting blocks are shown");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "reduced", "applied before paint on reload");
  assert.equal(await lenisOn(page), false);
  await page.evaluate(() => localStorage.removeItem("motion"));
  await context.close();
});

t.test("with no saved choice, data-motion follows the OS setting live", async () => {
  const { context, page } = await open();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "full");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.documentElement.dataset.motion === "reduced");
  assert.equal(await lenisOn(page), false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.documentElement.dataset.motion === "full");
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await context.close();
});

await t.run();
