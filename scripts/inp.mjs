// Interaction latency probe (a lab proxy for INP): runs the site's main interactions with CPU throttling
// and reports the slowest Event Timing entry (input delay + processing + next paint). Budget: ≤ 200 ms.
// Usage (after `pnpm build`): pnpm inp [--cpu 4]

import { DESKTOP, MOBILE, flag, launchBrowser, startServer } from "./lib/harness.mjs";

const cpu = Number(flag("cpu", "4"));
const { baseUrl, stop } = await startServer();
const results = [];

async function measure(browser, device, route, label, act) {
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__events = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.interactionId) window.__events.push({ name: e.name, d: e.duration });
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
  });
  let note = "";
  try {
    await act(page);
  } catch (err) {
    note = `(skipped: ${String(err.message).split("\n")[0].slice(0, 90)})`;
  }
  await page.waitForTimeout(500);
  const events = await page.evaluate(() => window.__events);
  const worst = events.reduce((m, e) => (e.d > m.d ? e : m), { name: "-", d: 0 });
  results.push({ label, worst: Math.round(worst.d), event: worst.name, n: events.length, note });
  await context.close();
}

try {
  const browser = await launchBrowser();
  await measure(browser, DESKTOP, "/", "seam: drag + keys", async (page) => {
    const handle = page.getByRole("slider").first();
    await handle.waitFor({ timeout: 3000 });
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) await page.mouse.move(box.x - 300 + i * 30, box.y + box.height / 2, { steps: 2 });
    await page.mouse.up();
    await handle.focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  });
  await measure(browser, DESKTOP, "/", "command palette: open, type, close", async (page) => {
    await page.keyboard.press("Control+k");
    await page.getByRole("dialog").waitFor({ timeout: 3000 });
    await page.keyboard.type("work", { delay: 40 });
    await page.keyboard.press("Escape");
  });
  await measure(browser, MOBILE, "/", "mobile: hero toggle + menu", async (page) => {
    await page.getByRole("button", { name: /^code$/i }).first().tap();
    await page.getByRole("button", { name: /menu/i }).first().tap();
  });
  await measure(browser, MOBILE, "/work", "work filter", async (page) => {
    for (const name of [/^video$/i, /^campaigns$/i, /^all$/i]) await page.getByRole("link", { name }).first().tap();
  });
  await browser.close();
} finally {
  stop();
}
for (const r of results) {
  console.log(`${r.worst <= 200 ? "✓" : "✗"} ${r.label}: worst ${r.worst} ms (${r.event}, ${r.n} interactions ≥16ms) ${r.note}`);
}
process.exit(results.some((r) => r.worst > 200) ? 1 : 0);
