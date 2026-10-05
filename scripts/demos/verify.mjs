// Verify the built demos offline and capture their posters.
//
//   node scripts/demos/verify.mjs [--shots <dir>] [slug ...]
//
// Serves public/ from a tiny local static server, opens every demo in Chrome (Playwright) with
// EVERY non-local request blocked and logged, and fails on: any external request attempt, any
// console error or page error, any 4xx/5xx. It clicks through the tabs, screenshots 1440x900 and
// 390x844 (viewport + full page) into --shots, and writes public/demos/<slug>/preview.jpg
// (1440x900 viewport, top of the page, JPEG q80): the poster the site shows.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { DASHBOARDS } from "./dashboards.mjs";
import { REPO, PUBLIC_DEMOS, WORK, dirSize, kb } from "./lib.mjs";

const argv = process.argv.slice(2);
const shotsDir = argv.includes("--shots") ? argv[argv.indexOf("--shots") + 1] : path.join(WORK, "shots");
const only = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--shots");
const list = DASHBOARDS.filter((d) => !only.length || only.includes(d.slug));
fs.mkdirSync(shotsDir, { recursive: true });

const PUBLIC = path.join(REPO, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  const p = path.normalize(path.join(PUBLIC, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!p.startsWith(PUBLIC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(p).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: "chrome" });
const results = [];
let failed = false;
for (const cfg of list) {
  const r = { slug: cfg.slug, external: [], errors: [], bad: [], tabs: [], shots: [] };
  for (const vp of [{ width: 1440, height: 900, tag: "1440" }, { width: 390, height: 844, tag: "390", mobile: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await ctx.route("**/*", (route) => {
      const u = route.request().url();
      if (u.startsWith(base + "/")) return route.continue();
      r.external.push(u.slice(0, 160));
      return route.abort();
    });
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") r.errors.push(`[${vp.tag}] ${m.text().slice(0, 200)}`); });
    page.on("pageerror", (e) => r.errors.push(`[${vp.tag}] ${String(e).slice(0, 200)}`));
    page.on("response", (res) => { if (res.status() >= 400) r.bad.push(`${res.status()} ${res.url()}`); });
    page.on("requestfailed", (req) => { if (req.url().startsWith(base)) r.bad.push(`failed ${req.url()}`); });
    await page.goto(`${base}/demos/${cfg.slug}/index.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const viewportShot = path.join(shotsDir, `${cfg.slug}-${vp.tag}.png`);
    await page.screenshot({ path: viewportShot });
    r.shots.push(viewportShot);
    if (!vp.mobile) {
      await page.screenshot({ path: path.join(PUBLIC_DEMOS, cfg.slug, "preview.jpg"), type: "jpeg", quality: 80 });
    }
    // every tab: click, check its panel is the only one shown, full-page shot
    const tabs = cfg.tabs ? await page.locator(cfg.tabs).all() : [];
    if ((cfg.views || []).length > 1 && tabs.length !== cfg.views.length) r.errors.push(`[${vp.tag}] expected ${cfg.views.length} tabs, found ${tabs.length}`);
    for (const t of tabs) if (await t.evaluate((b) => !!b.closest("[inert]"))) r.errors.push(`[${vp.tag}] a tab button is inert`);
    for (let i = 0; i < Math.max(1, tabs.length); i++) {
      if (tabs.length) {
        await tabs[i].click();
        await page.waitForTimeout(150);
        const st = await tabs[i].evaluate((b) => {
          const p = document.getElementById(b.getAttribute("aria-controls"));
          return { sel: b.getAttribute("aria-selected"), shown: !!p && !p.hidden, label: b.textContent.replace(/\s+/g, " ").trim() };
        });
        if (vp.mobile === undefined) r.tabs.push(st);
        if (st.sel !== "true" || !st.shown) { r.errors.push(`[${vp.tag}] tab ${i + 1} did not open its panel`); }
      }
      // scroll through so lazy images load, then wait for every image to settle
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) { window.scrollTo(0, y); await new Promise((ok) => setTimeout(ok, 60)); }
        window.scrollTo(0, 0);
        // capture only: load every shown image now (the page keeps loading="lazy")
        document.querySelectorAll('img[loading="lazy"]').forEach((im) => { im.loading = "eager"; });
        const shown = [...document.images].filter((im) => im.getAttribute("src") && im.getClientRects().length);
        const settle = Promise.all(shown.map((im) => (im.complete ? 0 : new Promise((ok) => { im.addEventListener("load", ok); im.addEventListener("error", ok); }))));
        await Promise.race([settle, new Promise((ok) => setTimeout(ok, 4000))]);
      });
      const broken = await page.evaluate(() => [...document.images].filter((im) => im.getClientRects().length && im.complete && im.naturalWidth === 0 && im.getAttribute("src")).map((im) => im.getAttribute("src")));
      for (const b of broken) r.errors.push(`[${vp.tag}] broken image ${b}`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(shotsDir, `${cfg.slug}-${vp.tag}-tab${i + 1}.png`) });
      const full = path.join(shotsDir, `${cfg.slug}-${vp.tag}-tab${i + 1}-full.png`);
      await page.screenshot({ path: full, fullPage: true });
      r.shots.push(full);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (vp.mobile) r.mobileOverflowPx = overflow; else r.desktopOverflowPx = overflow;
    await ctx.close();
  }
  const preview = path.join(PUBLIC_DEMOS, cfg.slug, "preview.jpg");
  r.preview = { src: `/demos/${cfg.slug}/preview.jpg`, width: 1440, height: 900, bytes: fs.statSync(preview).size };
  r.bytes = dirSize(path.join(PUBLIC_DEMOS, cfg.slug));
  r.ok = !r.external.length && !r.errors.length && !r.bad.length;
  if (!r.ok) failed = true;
  results.push(r);
  console.log(`${r.ok ? "OK  " : "FAIL"} ${cfg.slug}: ${kb(r.bytes)} | external ${r.external.length} | console/page errors ${r.errors.length} | 4xx/5xx ${r.bad.length} | tabs ${r.tabs.length} | overflow desktop ${r.desktopOverflowPx}px, mobile ${r.mobileOverflowPx}px`);
  for (const x of [...r.external, ...r.errors, ...r.bad].slice(0, 8)) console.log("     ", x);
}
await browser.close();
server.close();
fs.mkdirSync(WORK, { recursive: true });
fs.writeFileSync(path.join(WORK, "verify-report.json"), JSON.stringify(results, null, 1));
console.log(`screenshots: ${shotsDir}`);
process.exit(failed ? 1 : 0);
