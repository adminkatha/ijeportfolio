// Accessibility scan with axe-core (WCAG 2.0/2.1/2.2 A + AA + best practices) at 1440 and 390.
// Usage (after `pnpm build`): pnpm a11y [--routes /,/work,/work/sabbath-spa]

import { AxeBuilder } from "@axe-core/playwright";
import { DESKTOP, MOBILE, launchBrowser, routesFlag, startServer } from "./lib/harness.mjs";

const routes = routesFlag("/");
const { baseUrl, stop } = await startServer();
let count = 0;
try {
  const browser = await launchBrowser();
  for (const route of routes) {
    for (const [label, device] of [
      ["1440", DESKTOP],
      ["390", MOBILE],
    ]) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
      // Scroll through first so reveal-once content is checked in its final state.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      // Demo iframes are separate documents: scan them on their own (`--routes /demos/<slug>/index.html`),
      // otherwise axe pools their landmarks with the page's.
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .exclude("iframe")
        .analyze();
      for (const v of result.violations) {
        count++;
        console.log(`✗ ${route} @${label} [${v.impact}] ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 4)) console.log(`    ${n.target.join(" ")}`);
      }
      if (!result.violations.length) console.log(`✓ ${route} @${label}: 0 violations (${result.passes.length} rules passed)`);
      await context.close();
    }
  }
  await browser.close();
} finally {
  stop();
}
process.exit(count ? 1 : 0);
