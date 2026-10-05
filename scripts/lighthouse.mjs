// Lighthouse (mobile, default simulated throttling) per route: the four scores and lab vitals.
// Usage (after `pnpm build`): pnpm lighthouse [--routes /,/work/sabbath-spa] [--runs 3]
// JSON reports: .screenshots/lighthouse/ (gitignored). Exit 1 if any route misses 90/100/100/100, LCP 2.5s or CLS 0.1.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { flag, routesFlag, startServer } from "./lib/harness.mjs";

const routes = routesFlag("/");
const runs = Number(flag("runs", "1"));
const outDir = path.join(process.cwd(), ".screenshots", "lighthouse");
mkdirSync(outDir, { recursive: true });
const lhBin = path.join(process.cwd(), "node_modules", "lighthouse", "cli", "index.js");
const name = (route) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_"));

const { baseUrl, stop } = await startServer();
const summary = [];
try {
  for (const route of routes) {
    const results = [];
    for (let i = 0; i < runs; i++) {
      const out = path.join(outDir, `${name(route)}${runs > 1 ? `-${i + 1}` : ""}.json`);
      execFileSync(
        process.execPath,
        [lhBin, new URL(route, baseUrl).toString(), "--quiet", "--output=json", `--output-path=${out}`, "--chrome-flags=--headless=new"],
        { stdio: "inherit" },
      );
      const r = JSON.parse(readFileSync(out, "utf8"));
      const score = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
      const num = (k) => r.audits[k]?.numericValue ?? Number.NaN;
      // Lighthouse 13 reports the LCP node inside the lcp-breakdown insight.
      const lcpJson = JSON.stringify(r.audits["lcp-breakdown-insight"]?.details ?? r.audits["largest-contentful-paint-element"]?.details ?? {});
      const lcpNode = { snippet: (lcpJson.match(/"snippet":"((?:[^"\\]|\\.)*)"/)?.[1] ?? "").replace(/\\"/g, '"') || undefined };
      results.push({
        perf: score("performance"),
        a11y: score("accessibility"),
        bp: score("best-practices"),
        seo: score("seo"),
        lcp: num("largest-contentful-paint"),
        cls: num("cumulative-layout-shift"),
        tbt: num("total-blocking-time"),
        fcp: num("first-contentful-paint"),
        lcpEl: lcpNode?.snippet,
        failing: Object.values(r.audits)
          .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "manual" && a.scoreDisplayMode !== "notApplicable")
          .map((a) => a.id),
      });
    }
    const median = (k) => [...results].sort((a, b) => a[k] - b[k])[Math.floor(results.length / 2)][k];
    const row = {
      route,
      perf: median("perf"),
      a11y: median("a11y"),
      bp: median("bp"),
      seo: median("seo"),
      lcpMs: Math.round(median("lcp")),
      cls: Number(median("cls").toFixed(3)),
      tbtMs: Math.round(median("tbt")),
      fcpMs: Math.round(median("fcp")),
    };
    summary.push(row);
    console.log(
      `${route}: Performance ${row.perf} · Accessibility ${row.a11y} · Best Practices ${row.bp} · SEO ${row.seo} · FCP ${row.fcpMs}ms · LCP ${row.lcpMs}ms · CLS ${row.cls} · TBT ${row.tbtMs}ms`,
    );
    if (results[0].lcpEl) console.log(`    LCP element: ${results[0].lcpEl.slice(0, 160)}`);
    if (results[0].failing.length) console.log(`    audits below 100%: ${results[0].failing.join(", ")}`);
  }
} finally {
  stop();
}
const failed = summary.some((s) => s.perf < 90 || s.a11y < 100 || s.bp < 100 || s.seo < 100 || s.lcpMs > 2500 || s.cls > 0.1);
process.exit(failed ? 1 : 0);
