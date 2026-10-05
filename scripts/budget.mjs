// JS budget: gzipped JavaScript a route loads up front (before any interaction), measured in a real browser.
// Budget (CLAUDE.md): ≤ 170 KB gz; target ≤ 135 KB (PLAN §7).
// Usage (after `pnpm build`): pnpm budget [--routes /,/work] [--url http://localhost:3000]

import { gzipSync } from "node:zlib";
import { MOBILE, launchBrowser, routesFlag, startServer } from "./lib/harness.mjs";

const LIMIT = 170 * 1024;
const TARGET = 135 * 1024;
const routes = routesFlag("/,/work");
const { baseUrl, stop } = await startServer();
let failed = false;
try {
  const browser = await launchBrowser();
  for (const route of routes) {
    const context = await browser.newContext(MOBILE);
    const page = await context.newPage();
    const scripts = new Map();
    page.on("response", async (res) => {
      if (res.request().resourceType() !== "script") return;
      try {
        scripts.set(res.url(), gzipSync(await res.body(), { level: 9 }).length);
      } catch {
        // body unavailable (redirect etc.)
      }
    });
    await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
    await page.waitForTimeout(3000); // idle-time loads count too
    const total = [...scripts.values()].reduce((a, b) => a + b, 0);
    const verdict = total > LIMIT ? "✗ over budget" : total > TARGET ? "△ over target" : "✓";
    if (total > LIMIT) failed = true;
    console.log(`${verdict} ${route}: ${(total / 1024).toFixed(1)} KB gz in ${scripts.size} scripts`);
    for (const [url, size] of [...scripts].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
      console.log(`    ${(size / 1024).toFixed(1).padStart(6)} KB  ${new URL(url).pathname}`);
    }
    await context.close();
  }
  await browser.close();
} finally {
  stop();
}
process.exit(failed ? 1 : 0);
