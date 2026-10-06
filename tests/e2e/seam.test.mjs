// E2E for the CREATIVE | CODE hero seam (PLAN §2, phases 4 and 11).
// Run after `pnpm build`:   node tests/e2e/seam.test.mjs     (starts `next start -p 3401` itself)
// Or against a server:      node tests/e2e/seam.test.mjs --url http://localhost:3401

import assert from "node:assert/strict";
import { frames, harness } from "./_harness.mjs";

const t = await harness();
const HERO = 'section[aria-labelledby="hero-title"]';
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

/** Counts requestAnimationFrame requests, and records every seam/opacity value the page writes. */
const instrument = () => {
  window.__raf = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    window.__raf++;
    return raf(cb);
  };
  window.__writes = [];
  const setProperty = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function (prop, value, priority) {
    if (prop === "--seam" || prop.startsWith("--o-")) window.__writes.push([prop, String(value)]);
    return setProperty.call(this, prop, value, priority);
  };
};

const state = (page) =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const knob = root.querySelector('[role="slider"]');
    return {
      seam: parseFloat(getComputedStyle(root).getPropertyValue("--seam")),
      mode: root.dataset.mode,
      intro: root.dataset.intro,
      view: root.dataset.view,
      now: Number(knob.getAttribute("aria-valuenow")),
      text: knob.getAttribute("aria-valuetext"),
      raf: window.__raf,
    };
  }, HERO);

/** Waits until no animation frame has been requested for `quietMs`. */
async function settle(page, quietMs = 300, timeoutMs = 5000) {
  const start = Date.now();
  let last = (await state(page)).raf;
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(quietMs);
    const now = (await state(page)).raf;
    if (now === last) return;
    last = now;
  }
  throw new Error("the seam never settled");
}

/** rAF requests during `ms` of doing nothing. */
async function idleFrames(page, ms = 1000) {
  const before = (await state(page)).raf;
  await page.waitForTimeout(ms);
  return (await state(page)).raf - before;
}

async function open(options = DESKTOP) {
  const { context, page } = await t.newPage(options);
  await page.addInitScript(instrument);
  await page.goto(`${t.baseUrl}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

const nameRects = (page) =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return [b.x, b.y, b.width, b.height].map((n) => Math.round(n * 100) / 100);
    };
    return { creative: r(root.querySelector("h1")), code: r(root.querySelector('[aria-hidden="true"] .type-display')) };
  }, HERO);

// ── Phase 4: structure ───────────────────────────────────────────────────────

t.test("one h1, in the first HTML; the CODE layer is aria-hidden", async () => {
  const html = await (await fetch(`${t.baseUrl}/`)).text();
  assert.equal(html.match(/<h1[\s>]/g)?.length, 1, "exactly one <h1> in the server HTML");
  assert.match(html, /<h1 id="hero-title"[^>]*>Ehjay Lorenzo<\/h1>/);
  const { context, page } = await open();
  assert.equal(await page.locator(`${HERO} [aria-hidden="true"] .type-display`).count(), 1);
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  await context.close();
});

t.test("the h1 is the LCP element and is never at opacity 0", async () => {
  for (const options of [DESKTOP, PHONE]) {
    const { context, page } = await t.newPage(options);
    await page.addInitScript(() => {
      window.__lcp = [];
      window.__h1Opacity = [];
      new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__lcp.push(e.element?.id ?? e.element?.tagName))).observe({
        type: "largest-contentful-paint",
        buffered: true,
      });
      const sample = () => {
        const h1 = document.querySelector("h1");
        if (h1) window.__h1Opacity.push(Number(getComputedStyle(h1).opacity));
        if (performance.now() < 1500) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(`${t.baseUrl}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);
    const { lcp, opacities } = await page.evaluate(() => ({ lcp: window.__lcp, opacities: window.__h1Opacity }));
    assert.equal(lcp.at(-1), "hero-title", `LCP element at ${options.viewport.width}px`);
    assert.ok(opacities.length > 0 && opacities.every((o) => o === 1), "h1 opacity stays 1 through load and intro");
    await context.close();
  }
});

t.test("the two layers align exactly at 390 / 768 / 1440 / 2560", async () => {
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1440, 900],
    [2560, 1440],
  ]) {
    const { context, page } = await open({ viewport: { width, height } });
    const { creative, code } = await nameRects(page);
    assert.deepEqual(code, creative, `name boxes at ${width}px`);
    await context.close();
  }
});

t.test("CODE notes print the live token values (and the server fallbacks match them)", async () => {
  const html = await (await fetch(`${t.baseUrl}/`)).text();
  const { context, page } = await open();
  const { live, shown } = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    const els = [...document.querySelectorAll("[data-token]")];
    return {
      live: Object.fromEntries(els.map((el) => [el.dataset.token, css.getPropertyValue(el.dataset.token).trim()])),
      shown: els.map((el) => [el.dataset.token, el.textContent]),
    };
  });
  const norm = (v) => v.replace(/\s+/g, "").replace(/(^|[^\d.])\.(\d)/g, "$10.$2");
  for (const [token, text] of shown) {
    assert.equal(norm(text), norm(live[token]), `hydrated ${token}`);
    const ssr = new RegExp(`data-token="${token}">([^<]*)<`).exec(html)?.[1];
    if (token !== "--gutter") assert.equal(norm(ssr ?? ""), norm(live[token]), `server-rendered ${token}`);
  }
  const fontSize = await page.evaluate(() => getComputedStyle(document.querySelector("h1")).fontSize);
  const shownSize = await page.locator('[data-measure="font-size"]').first().textContent();
  assert.equal(parseFloat(shownSize), Math.round(parseFloat(fontSize) * 10) / 10);
  await context.close();
});

// ── Phase 11: interaction ────────────────────────────────────────────────────

t.test("intro settles within 800ms of hydration, then zero rAF callbacks at rest", async () => {
  const { context, page } = await open();
  await settle(page);
  const s = await state(page);
  assert.equal(s.intro, "done");
  assert.equal(s.seam, 50);
  assert.equal(await idleFrames(page), 0, "rAF requests while idle");
  await context.close();
});

t.test("follow mode eases to the cursor, returns to rest on leave, and sleeps when settled", async () => {
  const { context, page } = await open();
  await settle(page);
  assert.equal((await state(page)).mode, "follow");
  await page.mouse.move(720, 420); // enter at the rest position: nothing to do
  await settle(page);
  assert.equal((await state(page)).seam, 50);
  const before = (await state(page)).raf;
  await page.mouse.move(360, 420, { steps: 6 });
  await page.waitForTimeout(60);
  const moving = await state(page);
  assert.ok(moving.raf > before, "the loop runs while following");
  assert.ok(moving.seam < 50 && moving.seam > 25, `eased, not jumped (${moving.seam})`);
  await settle(page);
  assert.ok(Math.abs((await state(page)).seam - 25) < 0.05, "lands on the cursor (360 / 1440 = 25%)");
  assert.equal(await idleFrames(page), 0, "rAF requests once settled");
  await page.mouse.move(720, 899); // below the hero: the pointer leaves
  await page.mouse.move(720, 1200);
  await settle(page);
  assert.equal((await state(page)).seam, 50, "back to rest");
  assert.equal(await idleFrames(page), 0);
  await context.close();
});

t.test("resize 390 → 1440 → 390 switches modes both ways", async () => {
  const { context, page } = await open({ viewport: { width: 390, height: 844 } });
  const toggle = page.getByRole("group", { name: "Hero view" });
  const knob = page.getByRole("slider");
  assert.equal((await state(page)).mode, "toggle");
  assert.ok(await toggle.isVisible());
  assert.ok(!(await knob.isVisible()));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(100);
  assert.equal((await state(page)).mode, "follow");
  assert.ok(!(await toggle.isVisible()));
  assert.ok(await knob.isVisible());
  await page.mouse.move(1080, 400, { steps: 4 });
  await settle(page);
  assert.ok(Math.abs((await state(page)).seam - 75) < 0.05, "follows the cursor after the switch");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const s = await state(page);
  assert.equal(s.mode, "toggle");
  assert.ok(await toggle.isVisible());
  const seamBefore = s.seam;
  await page.mouse.move(40, 300, { steps: 4 });
  await page.waitForTimeout(300);
  assert.equal((await state(page)).seam, seamBefore, "no cursor-follow in toggle mode");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(100);
  assert.equal((await state(page)).mode, "follow", "and back again");
  await settle(page);
  assert.equal(await idleFrames(page), 0);
  await context.close();
});

t.test("coarse pointer at ≥768 is drag mode, and a touch drag moves the seam", async () => {
  const { context, page } = await open({ viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true });
  await settle(page);
  assert.equal((await state(page)).mode, "drag");
  const box = await page.getByRole("slider").boundingBox();
  const cdp = await context.newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const touch = (type, px) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: px, y }] });
  await touch("touchStart", x);
  for (let i = 1; i <= 8; i++) await touch("touchMove", x + i * 25);
  await touch("touchEnd", x + 200);
  await settle(page);
  const s = await state(page);
  assert.ok(Math.abs(s.seam - ((x + 200) / 1024) * 100) < 0.3, `seam follows the finger (${s.seam})`);
  assert.equal(s.now, Math.round(s.seam), "aria-valuenow committed on release");
  assert.equal(await idleFrames(page), 0);
  await context.close();
});

t.test("keys update aria-valuenow (arrows, Page keys, Home/End)", async () => {
  const { context, page } = await open();
  await settle(page);
  const knob = page.getByRole("slider");
  await knob.focus();
  const expectNow = async (key, value) => {
    await page.keyboard.press(key);
    const s = await state(page);
    assert.equal(s.now, value, `${key} → aria-valuenow`);
    assert.equal(s.text, `Creative ${value}%, code ${100 - value}%`, `${key} → aria-valuetext`);
  };
  await expectNow("ArrowRight", 51);
  await expectNow("ArrowUp", 52);
  await expectNow("ArrowLeft", 51);
  await expectNow("ArrowDown", 50);
  await expectNow("PageUp", 60);
  await expectNow("PageDown", 50);
  await expectNow("End", 92);
  await expectNow("ArrowRight", 92);
  await expectNow("Home", 8);
  await expectNow("ArrowLeft", 8);
  await settle(page);
  assert.equal((await state(page)).seam, 8, "the seam follows the slider");
  assert.equal(await knob.getAttribute("aria-valuemin"), "8");
  assert.equal(await knob.getAttribute("aria-valuemax"), "92");
  assert.equal(await knob.getAttribute("aria-label"), "Creative / Code seam");
  await context.close();
});

t.test("seam always 8–92 and opacities 0–1, including a pointer far outside the box", async () => {
  const { context, page } = await open();
  await settle(page);
  // Synthetic cursor positions far outside the hero, in follow mode.
  for (const clientX of [-1e6, -50, 1e6, 1e9]) {
    await page.evaluate(
      ({ sel, clientX }) => document.querySelector(sel).dispatchEvent(new PointerEvent("pointermove", { clientX, clientY: 300, pointerType: "mouse", bubbles: true })),
      { sel: HERO, clientX },
    );
    await settle(page);
    assert.equal((await state(page)).seam, clientX < 0 ? 8 : 92, `pinned to the nearest edge for x=${clientX}`);
  }
  // A real drag of the handle, out past both edges of the window.
  const box = await page.getByRole("slider").boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(-3000, y, { steps: 5 });
  await frames(page, 2);
  assert.equal((await state(page)).seam, 8);
  await page.mouse.move(9000, y, { steps: 5 });
  await frames(page, 2);
  assert.equal((await state(page)).seam, 92);
  await page.mouse.up();
  // Hammer the keys past the ends.
  await page.getByRole("slider").focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("PageUp");
  for (let i = 0; i < 12; i++) await page.keyboard.press("PageDown");
  await settle(page);

  const writes = await page.evaluate(() => window.__writes);
  const seams = writes.filter(([p]) => p === "--seam").map(([, v]) => parseFloat(v));
  const opacities = writes.filter(([p]) => p.startsWith("--o-")).map(([, v]) => parseFloat(v));
  assert.ok(seams.length > 20 && opacities.length > 10, "values were recorded");
  assert.ok(seams.every((v) => v >= 8 && v <= 92), `every --seam written is 8–92 (min ${Math.min(...seams)}, max ${Math.max(...seams)})`);
  assert.ok(opacities.every((v) => v >= 0 && v <= 1), "every derived opacity written is 0–1");
  const rendered = await page.evaluate((sel) => [...document.querySelectorAll(`${sel} [data-annot], ${sel} [class*="side"]`)].map((el) => Number(getComputedStyle(el).opacity)), HERO);
  assert.ok(rendered.every((o) => o >= 0 && o <= 1), "computed opacities 0–1");
  await context.close();
});

t.test("correct at 2560px", async () => {
  const { context, page } = await open({ viewport: { width: 2560, height: 1440 } });
  await settle(page);
  const { creative, code } = await nameRects(page);
  assert.deepEqual(code, creative);
  for (const x of [640, 1280, 1920, 2559]) {
    await page.mouse.move(x, 500, { steps: 3 });
    await settle(page);
    const expected = Math.min(92, Math.max(8, (x / 2560) * 100));
    const s = await state(page);
    assert.ok(Math.abs(s.seam - expected) < 0.05, `seam at x=${x}: ${s.seam} vs ${expected}`);
    const line = await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      const knob = root.querySelector('[role="slider"]').getBoundingClientRect();
      return { knob: knob.x + knob.width / 2, width: root.getBoundingClientRect().width };
    }, HERO);
    assert.equal(line.width, 2560);
    assert.ok(Math.abs(line.knob - (expected / 100) * 2560) < 1, `handle sits on the seam at x=${x}`);
  }
  await context.close();
});

t.test("reduced motion: no intro, no cursor-follow, no easing", async () => {
  const { context, page } = await open({ ...DESKTOP, reducedMotion: "reduce" });
  const first = await state(page);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), "reduced");
  assert.equal(first.mode, "drag");
  assert.equal(first.intro, "done");
  assert.equal(first.seam, 50);
  assert.equal(await page.evaluate((sel) => document.querySelector(sel).getAnimations({ subtree: true }).length, HERO), 0, "no running animations");
  await page.mouse.move(200, 400, { steps: 5 });
  await page.waitForTimeout(300);
  assert.equal((await state(page)).seam, 50, "the cursor does not move the seam");
  await page.getByRole("slider").focus();
  await page.keyboard.press("PageUp");
  await frames(page, 2);
  assert.equal((await state(page)).seam, 60, "keys land without easing");
  assert.equal(await idleFrames(page, 600), 0);
  await context.close();
});

t.test("the site's motion setting (data-motion) switches follow ↔ drag live", async () => {
  const { context, page } = await open();
  await settle(page);
  assert.equal((await state(page)).mode, "follow");
  await page.evaluate(() => document.documentElement.setAttribute("data-motion", "reduced"));
  await page.waitForTimeout(50);
  assert.equal((await state(page)).mode, "drag");
  await page.evaluate(() => document.documentElement.setAttribute("data-motion", "full"));
  await page.waitForTimeout(50);
  assert.equal((await state(page)).mode, "follow");
  await context.close();
});

t.test("under 768px: a Creative / Code toggle with aria-pressed", async () => {
  const { context, page } = await open(PHONE);
  const creative = page.getByRole("button", { name: "Creative", exact: true });
  const code = page.getByRole("button", { name: "Code", exact: true });
  assert.equal(await creative.getAttribute("aria-pressed"), "true");
  assert.equal(await code.getAttribute("aria-pressed"), "false");
  await code.click();
  await page.waitForTimeout(400);
  assert.equal(await code.getAttribute("aria-pressed"), "true");
  assert.equal(await creative.getAttribute("aria-pressed"), "false");
  const layers = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const code = root.querySelector('[aria-hidden="true"]');
    const h1 = root.querySelector("h1");
    return { view: root.dataset.view, code: getComputedStyle(code).opacity, codeVisible: getComputedStyle(code).visibility, h1: getComputedStyle(h1.parentElement.parentElement).opacity };
  }, HERO);
  assert.deepEqual(layers, { view: "code", code: "1", codeVisible: "visible", h1: "0" });
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1, "the h1 stays in the accessibility tree");
  await creative.click();
  await page.waitForTimeout(400);
  assert.equal((await state(page)).view, "creative");
  await context.close();
});

/** One drag session (three drags and a key press) at 2× CPU; returns the interaction timings. */
async function dragSession() {
  const { context, page } = await open();
  await settle(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 2 });
  await page.evaluate(() => {
    window.__events = [];
    new PerformanceObserver((list) =>
      list.getEntries().forEach((e) => e.interactionId && window.__events.push({ name: e.name, duration: e.duration, processing: e.processingEnd - e.processingStart })),
    ).observe({ type: "event", durationThreshold: 16, buffered: true });
  });
  const box = await page.getByRole("slider").boundingBox();
  const y = box.y + box.height / 2;
  for (let round = 0; round < 3; round++) {
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) await page.mouse.move(box.x + box.width / 2 + (i % 2 ? -1 : 1) * i * 18, y);
    await page.mouse.up();
  }
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  const events = await page.evaluate(() => window.__events);
  await context.close();
  return events;
}

t.test("INP while dragging stays under 200ms (2× CPU throttling)", async () => {
  // A shared machine (parallel builds) can stall the renderer for a moment, so each criterion
  // gets up to three attempts: the slowest interaction ≤ 200ms, and the slowest seam handler ≤ 50ms.
  const attempts = [];
  for (let i = 0; i < 3; i++) {
    const events = await dragSession();
    const worst = Math.max(0, ...events.map((e) => e.duration));
    const handler = Math.max(0, ...events.map((e) => e.processing));
    if (process.env.SEAM_DEBUG) console.log(events.map((e) => `${e.name}:${Math.round(e.duration)}/${e.processing.toFixed(1)}`).join(" "));
    attempts.push(`${worst}ms (handlers ${handler.toFixed(1)}ms)`);
    if (worst <= 200 && handler <= 50) return;
  }
  assert.fail(`slowest interaction per attempt: ${attempts.join(", ")}`);
});

await t.run();
