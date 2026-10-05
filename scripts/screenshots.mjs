// Phase screenshots at 1440 / 768 / 390, plus a console-error and failed-response check.
//
// Usage (after `pnpm build`):
//   pnpm screens --phase 0                  # starts `next start` on :3100, shoots "/", stops it
//   pnpm screens --phase 5 --routes /,/work # several routes
//   pnpm screens --url http://localhost:3000 --phase dev   # use an already-running server
//
// Output: .screenshots/phase-<N>/<route>-<width>.png and report.json
// Exit code 1 if any page logs a console error, a hydration warning, or gets a 4xx/5xx response.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const phase = flag("phase", "latest");
const routes = flag("routes", "/").split(",").map((r) => r.trim()).filter(Boolean);
const externalUrl = flag("url", null);
const port = Number(flag("port", "3100"));
const baseUrl = externalUrl ?? `http://localhost:${port}`;

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const outDir = path.join(process.cwd(), ".screenshots", `phase-${phase}`);
mkdirSync(outDir, { recursive: true });

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" }); // local Chrome, no download needed
  } catch {
    return await chromium.launch(); // bundled Chromium, if installed
  }
}

const slug = (route) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/[\/?#=&]/g, "_"));

let server = null;
if (!externalUrl) {
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { stdio: "ignore" });
}

const issues = [];
const report = { phase, baseUrl, takenAt: new Date().toISOString(), shots: [], issues };

try {
  await waitForServer(baseUrl);
  const browser = await launchBrowser();

  for (const route of routes) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile ?? false,
        hasTouch: vp.hasTouch ?? false,
        deviceScaleFactor: vp.deviceScaleFactor ?? 1,
      });
      const page = await context.newPage();
      const where = `${route} @${vp.width}`;

      page.on("console", (msg) => {
        const text = msg.text();
        if (msg.type() === "error" || /hydrat/i.test(text)) {
          const source = msg.location()?.url;
          issues.push({ where, kind: `console.${msg.type()}`, text: `${text.slice(0, 500)}${source ? ` ← ${source}` : ""}` });
        }
      });
      page.on("pageerror", (err) => issues.push({ where, kind: "pageerror", text: String(err).slice(0, 500) }));
      page.on("response", (res) => {
        if (res.status() >= 400) issues.push({ where, kind: `http ${res.status()}`, text: res.url() });
      });
      page.on("requestfailed", (req) => {
        issues.push({ where, kind: "requestfailed", text: `${req.url()} (${req.failure()?.errorText ?? "unknown"})` });
      });

      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
      // Scroll through once so lazy content and reveal-once sections are in their final state.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);

      const file = path.join(outDir, `${slug(route)}-${vp.width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      report.shots.push(path.relative(process.cwd(), file));
      await context.close();
    }
  }

  await browser.close();
} finally {
  if (server) server.kill();
}

writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(`Screenshots: ${report.shots.length} → ${path.relative(process.cwd(), outDir)}`);
if (issues.length) {
  console.error(`✗ ${issues.length} issue(s):`);
  for (const i of issues) console.error(`  [${i.where}] ${i.kind}: ${i.text}`);
  process.exit(1);
}
console.log("✓ No console errors, hydration warnings or failed responses.");
