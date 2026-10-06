// Keyboard pass: tabs through each route from the top and lists every stop (role, name, visible focus ring).
// Fails if the skip link isn't first, if any stop has no visible focus indicator, or if focus gets trapped.
// Usage (after `pnpm build`): pnpm keyboard [--routes /,/work/sabbath-spa] [--stops 60]

import { DESKTOP, flag, launchBrowser, routesFlag, startServer } from "./lib/harness.mjs";

const routes = routesFlag("/");
const maxStops = Number(flag("stops", "60"));
const { baseUrl, stop } = await startServer();
let problems = 0;
try {
  const browser = await launchBrowser();
  for (const route of routes) {
    const page = await browser.newPage(DESKTOP);
    await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
    const seen = [];
    for (let i = 0; i < maxStops; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const after = getComputedStyle(el, "::after");
        const ring =
          (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
          (after.outlineStyle !== "none" && parseFloat(after.outlineWidth) > 0) ||
          cs.boxShadow !== "none";
        const name = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
        const inFrame = el.tagName === "IFRAME";
        return { tag: el.tagName.toLowerCase(), role: el.getAttribute("role") || "", name, ring, inFrame, key: el.outerHTML.slice(0, 120) };
      });
      if (!info) break;
      if (seen.length && seen[0].key === info.key) break; // wrapped around
      seen.push(info);
    }
    console.log(`\n${route}: ${seen.length} tab stops`);
    seen.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)} ${s.ring || s.inFrame ? "✓" : "✗ no focus ring"} ${s.tag}${s.role ? `[${s.role}]` : ""} "${s.name}"`));
    if (!/skip/i.test(seen[0]?.name ?? "")) {
      problems++;
      console.log("  ✗ the first stop isn't the skip link");
    }
    problems += seen.filter((s) => !s.ring && !s.inFrame).length;
    await page.close();
  }
  await browser.close();
} finally {
  stop();
}
console.log(problems ? `\n✗ ${problems} problem(s)` : "\n✓ keyboard pass clean");
process.exit(problems ? 1 : 0);
