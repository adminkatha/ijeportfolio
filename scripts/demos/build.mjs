// Build the static, offline, sample-data demos in public/demos/<slug>/.
//
//   node scripts/demos/build.mjs [slug ...]
//
// For each dashboard (config in dashboards.mjs):
//  1. assets.py   - client logo + public ad thumbnails from the saved page, resized and renamed
//  2. gen/*.py    - a seeded, synthetic data.json in the shape the dashboard's renderer reads
//  3. fonts       - the Google Fonts the page used (latin subset) are self-hosted, with their OFL
//  4. template    - the saved page with JS off: trackers, external scripts/fonts and the real data the
//                   renderer would append to are removed (the renderer itself stays, build-time only)
//  5. render      - Playwright loads the template on a fake origin; every request except the template,
//                   data.json and local assets is aborted. The dashboard's own code draws every KPI,
//                   table and SVG chart from the SAMPLE data. Clock and Math.random are fixed.
//  6. sanitise    - all scripts, comments, handlers, IDs, titles and app-only chrome are stripped,
//                   the agency mark becomes a neutral wordmark, controls are made inert; a tiny tab
//                   script, noindex, the demo title and a "Demo - sample data" label are added.
// Nothing here ever contacts the dashboards' live services.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { DASHBOARDS, REMOVE_ALWAYS, INERT_ALWAYS } from "./dashboards.mjs";
import { PUBLIC_DEMOS, WORK, findSource, brandWords, brandWordRe, dirSize, kb } from "./lib.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const ORIGIN = "http://demo.invalid";
const FIXED_NOW = new Date("2026-10-05T12:00:00Z");
const PY = process.env.PYTHON || "python";

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const list = DASHBOARDS.filter((d) => !only.length || only.includes(d.slug));
if (!list.length) throw new Error(`No dashboard matches ${only.join(", ")}`);

const browser = await chromium.launch({ channel: "chrome" });
const report = [];
try {
  for (const cfg of list) report.push(await buildOne(cfg));
} finally {
  await browser.close();
}
fs.mkdirSync(WORK, { recursive: true });
fs.writeFileSync(path.join(WORK, "build-report.json"), JSON.stringify(report, null, 1));
for (const r of report) console.log(`${r.slug}: ${kb(r.bytes)} total, index.html ${kb(r.htmlBytes)}, blocked during render: ${r.blocked.length}, page errors: ${r.errors.length}`);

// ------------------------------------------------------------------------------------------
async function buildOne(cfg) {
  const src = findSource(cfg.source);
  const outDir = path.join(PUBLIC_DEMOS, cfg.slug);
  const assetsDir = path.join(outDir, "assets");
  const work = path.join(WORK, cfg.slug);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  // fresh outputs, but keep downloaded fonts (they are the only network fetch, done once)
  for (const f of fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : []) if (f !== "fonts") fs.rmSync(path.join(assetsDir, f), { recursive: true, force: true });
  for (const f of ["index.html"]) fs.rmSync(path.join(outDir, f), { force: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  // 1-2. assets + sample data
  const manifest = path.join(work, "manifest.json");
  const dataPath = path.join(work, "data.json");
  py("assets.py", ["--slug", cfg.slug, "--inner", src.inner, "--files", src.filesDir, "--out", assetsDir, "--manifest", manifest]);
  py(path.join("gen", cfg.generator), ["--out", dataPath, "--manifest", manifest]);

  // 3. fonts
  const fontsCss = await ensureFonts(src, assetsDir);

  // 4. template (JS off)
  const saved = fs.readFileSync(src.inner, "utf8");
  const template = await makeTemplate(saved, cfg, fontsCss);
  fs.writeFileSync(path.join(work, "template.html"), template);

  // 5-6. render + sanitise
  const { html, blocked, errors } = await render(template, cfg, dataPath, assetsDir);
  const final = finalize(html, cfg, assetsDir);
  fs.writeFileSync(path.join(outDir, "index.html"), final);
  pruneAssets(assetsDir, final);
  return { slug: cfg.slug, bytes: dirSize(outDir), htmlBytes: Buffer.byteLength(final), blocked, errors };
}

function py(script, args) {
  const out = execFileSync(PY, [path.join(HERE, script), ...args], {
    cwd: path.join(HERE, path.dirname(script)), encoding: "utf8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", PYTHONIOENCODING: "utf-8" },
  });
  process.stdout.write(out);
}

/* Drop asset files the finished page never references (fonts.css and the OFL texts stay). */
function pruneAssets(assetsDir, html) {
  const fontsCss = path.join(assetsDir, "fonts", "fonts.css");
  const refs = html + (fs.existsSync(fontsCss) ? fs.readFileSync(fontsCss, "utf8") : "");
  for (const f of fs.readdirSync(assetsDir, { withFileTypes: true })) {
    if (f.isDirectory()) {
      for (const g of fs.readdirSync(path.join(assetsDir, f.name))) {
        if (g === "fonts.css" || /^ofl-.*\.txt$/.test(g)) continue;
        if (!refs.includes(g)) fs.rmSync(path.join(assetsDir, f.name, g));
      }
    } else if (!refs.includes(f.name)) {
      fs.rmSync(path.join(assetsDir, f.name));
    }
  }
}

// ------------------------------------------------------------------------------------------ fonts
async function ensureFonts(src, assetsDir) {
  const cssPath = path.join(src.filesDir, "css2");
  if (!fs.existsSync(cssPath)) return null; // the page used a system font stack
  const dir = path.join(assetsDir, "fonts");
  fs.mkdirSync(dir, { recursive: true });
  const css = fs.readFileSync(cssPath, "utf8");
  const faces = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].filter((m) => m[1] === "latin");
  const out = [];
  const families = new Set();
  for (const [, , body] of faces) {
    const family = body.match(/font-family:\s*'([^']+)'/)[1];
    const url = body.match(/url\(([^)]+)\)/)[1];
    const fslug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const style = body.match(/font-style:\s*(\w+)/)[1];
    const file = `${fslug}-${style}-${createHash("sha1").update(url).digest("hex").slice(0, 6)}.woff2`;
    const dest = path.join(dir, file);
    if (!fs.existsSync(dest)) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`font download failed ${res.status}: ${family}`);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
    families.add(family);
    out.push(`@font-face{${body.trim().replace(/src:\s*url\([^)]+\)/, `src:url(${file})`).replace(/\s*\n\s*/g, "")}}`);
  }
  fs.writeFileSync(path.join(dir, "fonts.css"), out.join("\n") + "\n");
  // SIL Open Font License texts, from the Google Fonts repository (once)
  for (const family of families) {
    const lic = path.join(dir, `ofl-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`);
    if (fs.existsSync(lic)) continue;
    const res = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family.toLowerCase().replace(/[^a-z0-9]/g, "")}/OFL.txt`);
    if (!res.ok) throw new Error(`license download failed for ${family}`);
    // the license text is kept verbatim; a contact address in a copyright line is written "name [at] domain"
    // so the published demos carry no email pattern
    fs.writeFileSync(lic, (await res.text()).replace(/([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, "$1 [at] $2"));
  }
  return "assets/fonts/fonts.css";
}

// ------------------------------------------------------------------------------------------ template
async function makeTemplate(saved, cfg, fontsCss) {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(ORIGIN + "/index.html") ? r.fulfill({ body: saved, contentType: "text/html; charset=utf-8" }) : r.abort()));
  const page = await ctx.newPage();
  await page.goto(ORIGIN + "/index.html", { waitUntil: "domcontentloaded" });
  const html = await page.evaluate(({ preclean, fontsCss }) => {
    const rm = (sel) => document.querySelectorAll(sel).forEach((e) => e.remove());
    // trackers + external scripts + iframes; the inline renderer stays for the build-time render
    rm("script[src], noscript, iframe, object, embed");
    document.querySelectorAll("script").forEach((s) => { if (/dataLayer|gtag\(|googletagmanager/.test(s.textContent)) s.remove(); });
    rm('link[rel="preconnect"], link[rel="dns-prefetch"], link[rel="prefetch"], link[rel="preload"], link[rel="stylesheet"]');
    if (fontsCss) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = fontsCss;
      document.head.appendChild(l);
    }
    // real data the renderer would append to rather than replace
    for (const sel of preclean) rm(sel);
    // the hash (#ads / #email) of the saved copy is not carried over: the build starts on tab 1
    return "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
  }, { preclean: cfg.preclean || [], fontsCss });
  await ctx.close();
  return html;
}

// ------------------------------------------------------------------------------------------ render
async function render(template, cfg, dataPath, assetsDir) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const blocked = [];
  const errors = [];
  await ctx.addInitScript(() => {
    // deterministic Math.random (some renderers use it for ids)
    let s = 0x2f6b9d1;
    Math.random = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { localStorage.clear(); } catch {}
  });
  await ctx.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== ORIGIN) { blocked.push(u.href.slice(0, 120)); return route.abort(); }
    const p = decodeURIComponent(u.pathname);
    if (p === "/" || p === "/index.html") return route.fulfill({ body: template, contentType: "text/html; charset=utf-8" });
    if (p === "/data.json") return route.fulfill({ path: dataPath, contentType: "application/json" });
    if (p.startsWith("/assets/")) {
      const f = path.join(assetsDir, p.slice("/assets/".length));
      if (fs.existsSync(f)) return route.fulfill({ path: f });
    }
    blocked.push(u.href.slice(0, 120));
    return route.abort();
  });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(FIXED_NOW);
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  await page.goto(ORIGIN + "/index.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => { const a = document.getElementById("app"); return a && !a.hidden; }, null, { timeout: 30000 });
  await page.waitForTimeout(600);

  const tabSel = cfg.tabs;
  if (tabSel && cfg.renderTabs) {
    const n = await page.locator(tabSel).count();
    for (let i = n - 1; i >= 0; i--) { await page.locator(tabSel).nth(i).click(); await page.waitForTimeout(700); }
  }
  if (cfg.afterRender) await page.evaluate(cfg.afterRender);

  const html = await page.evaluate(sanitizeInPage, {
    tabPanel: cfg.tabPanel || "",
    tabSub: (cfg.tabSubtitle && cfg.tabSubtitle.values) || {},
    removeSel: [...REMOVE_ALWAYS, ...(cfg.remove || [])],
    inertSel: [...INERT_ALWAYS, ...(cfg.inert || [])],
    tabSel: tabSel || "",
    brand: brandWords(),
    hasLogo: fs.existsSync(path.join(assetsDir, "logo.png")),
    updatedText: cfg.updatedText || "Oct 5, 2026",
  });
  await ctx.close();
  return { html, blocked, errors };
}

/* Runs inside the rendered page. Returns the cleaned document as a string. */
function sanitizeInPage({ tabPanel, tabSub, removeSel, inertSel, tabSel, brand, hasLogo, updatedText }) {
  const brandRe = new RegExp(brand.join("|"), "i");
  // tabs: every tab button gets role=tab, aria-selected and aria-controls (from the config template
  // "pane-{data-tab}" when the dashboard links them in script only)
  if (tabSel) document.querySelectorAll(tabSel).forEach((b) => {
    if (!b.getAttribute("aria-controls") && tabPanel) b.setAttribute("aria-controls", tabPanel.replace(/\{([\w-]+)\}/g, (m, a) => b.getAttribute(a) || ""));
    const on = b.getAttribute("aria-selected") === "true" || b.classList.contains("on") || b.getAttribute("aria-pressed") === "true";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", on ? "true" : "false");
    b.removeAttribute("aria-pressed");
    const sub = tabSub[b.getAttribute("data-tab") || b.getAttribute("data-v") || ""];
    if (sub) b.setAttribute("data-sub", sub);
  });
  // text scrub: account-style ids (ddd-ddd-dddd), ad-account ids, 9+ digit runs, emails
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const scrub = (t) => t.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "(ID removed)").replace(/\bact_\d+/g, "(ID removed)")
    .replace(/(?<![\d.,])\d{9,}(?![\d.,])/g, "(ID removed)").replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "(email removed)");
  while (tw.nextNode()) { const n = tw.currentNode; const v = scrub(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
  // form state -> attributes; selects keep only what they show
  document.querySelectorAll("input").forEach((i) => {
    if (i.type === "checkbox" || i.type === "radio") i.toggleAttribute("checked", i.checked);
    else if (i.value) i.setAttribute("value", i.value);
    else i.removeAttribute("value");
  });
  document.querySelectorAll("select").forEach((s) => {
    const keep = s.options[s.selectedIndex];
    [...s.options].forEach((o) => { if (o !== keep) o.remove(); });
    if (keep) keep.setAttribute("selected", "");
    s.querySelectorAll("optgroup").forEach((g) => { if (!g.children.length) g.remove(); });
  });
  document.querySelectorAll("textarea").forEach((t) => { t.textContent = t.value; });

  // everything executable or live-only
  document.querySelectorAll("script, noscript, iframe, object, embed, form, link[rel=preconnect], link[rel=dns-prefetch], link[rel=prefetch], link[rel=preload], link[rel=manifest]").forEach((e) => e.remove());
  removeSel.forEach((s) => document.querySelectorAll(s).forEach((e) => e.remove()));

  // the agency mark -> a neutral wordmark (no logo, no name)
  document.querySelectorAll(".agency").forEach((a) => { a.innerHTML = '<span class="demo-wordmark">Client reporting</span>'; });
  document.querySelectorAll(".footer-brand").forEach((f) => {
    const thru = f.querySelector("[id$='through']");
    f.innerHTML = '<span class="demo-wordmark">Client reporting</span>' + (thru ? '<div class="made">' + thru.outerHTML + "</div>" : "");
  });
  document.querySelectorAll("img").forEach((im) => { if (brandRe.test(im.id) || brandRe.test(im.alt || "")) im.remove(); });

  // client logo + favicon from local files
  if (hasLogo) {
    document.querySelectorAll("img#logo, img.brand-logo").forEach((im) => { im.src = "assets/logo.png"; });
    document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
    const fav = document.createElement("link");
    fav.rel = "icon"; fav.href = "assets/logo.png";
    document.head.appendChild(fav);
  }
  const upd = document.getElementById("updated");
  if (upd) upd.textContent = updatedText;

  // links: nothing navigates away from the demo
  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (/^(#|$)/.test(href)) return;
    const span = document.createElement("span");
    span.className = a.className;
    span.innerHTML = a.innerHTML;
    a.replaceWith(span);
  });

  // attributes: handlers, tooltips, ids of ad creatives, and anything carrying the agency name
  document.querySelectorAll("*").forEach((el) => {
    for (const at of [...el.attributes]) {
      const n = at.name;
      if (/^on/i.test(n) || n === "title" || n === "data-cid" || n === "data-ci" || n === "sandbox" || n === "srcset") el.removeAttribute(n);
      else if (n === "id" && brandRe.test(at.value)) el.setAttribute("id", "prep-mark");
      else if (n === "class" && brandRe.test(at.value)) el.setAttribute("class", at.value.replace(new RegExp(brand.join("|"), "gi"), "prep"));
      else if (/^(d|points|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height|transform|viewBox|style|offset|stroke-dasharray)$/.test(n) && /\d\.\d{2,}/.test(at.value))
        el.setAttribute(n, at.value.replace(/(\d+\.\d)\d+/g, "$1"));
    }
  });

  // comments
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());

  // app-only controls stay visible but inert; tabs keep working through the demo script
  const tabs = tabSel ? new Set(document.querySelectorAll(tabSel)) : new Set();
  inertSel.forEach((s) => document.querySelectorAll(s).forEach((e) => { if (![...tabs].some((t) => e.contains(t))) e.setAttribute("inert", ""); }));
  document.querySelectorAll("button").forEach((b) => { if (!tabs.has(b) && !b.closest("[inert]")) b.setAttribute("inert", ""); });
  tabs.forEach((t) => { t.removeAttribute("inert"); t.setAttribute("tabindex", t.getAttribute("aria-selected") === "true" ? "0" : "-1"); });

  return "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
}

// ------------------------------------------------------------------------------------------ finalize
function finalize(html, cfg, assetsDir) {
  const words = brandWordRe();
  // style blocks: drop comments; selectors naming the agency follow the renamed ids/classes
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, a, css, b) =>
    a + css.replace(/\/\*[\s\S]*?\*\//g, "").replace(new RegExp(`([#.])[\\w-]*(?:${words.source})[\\w-]*`, "gi"), (s, p) => (p === "#" ? "#prep-mark" : ".prep")) + b);
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // large inline images -> files (keeps the page small and free of long base64 runs)
  let n = 0;
  html = html.replace(/data:(image\/(png|jpeg|webp|avif|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)/g, (m, mime, ext, b64) => {
    if (b64.length < 1800) return m;
    const buf = Buffer.from(b64, "base64");
    const name = `inline-${++n}.${ext === "svg+xml" ? "svg" : ext === "jpeg" ? "jpg" : ext}`;
    fs.writeFileSync(path.join(assetsDir, name), buf);
    return `assets/${name}`;
  });

  const title = `${cfg.client} — Demo (sample data)`;
  html = html.replace(/<title>[\s\S]*?<\/title>/, "");
  html = html.replace(/<head>/, `<head>\n<meta name="robots" content="noindex, nofollow">\n<title>${title}</title>`);
  html = html.replace(/<\/body>/, `${demoChrome(cfg)}\n</body>`);

  // hard guarantees
  const leftovers = html.match(new RegExp(words.source, "gi"));
  if (leftovers) throw new Error(`${cfg.slug}: the agency name is still in the page (${leftovers.length}x)`);
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  if (scripts.length !== 1 || /src=/.test(scripts[0])) throw new Error(`${cfg.slug}: unexpected scripts ${scripts.join(" ")}`);
  const ext = html.match(/\b(?:src|href|srcset|poster|action)\s*=\s*["']?\s*(?:https?:)?\/\/[^"'\s>]+/gi) || [];
  const cssUrls = (html.match(/url\(\s*["']?(?:https?:)?\/\/[^)]+\)/gi) || []);
  if (ext.length || cssUrls.length) throw new Error(`${cfg.slug}: external references ${[...ext, ...cssUrls].slice(0, 5).join(" ")}`);
  return html;
}

function demoChrome(cfg) {
  const css = `<style>
.demo-wordmark{font:600 11px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.75;white-space:nowrap}
.demo-badge{position:fixed;left:0;bottom:12px;z-index:99999;pointer-events:none;writing-mode:vertical-rl;transform:rotate(180deg);font:700 9px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#fff;background:rgba(17,18,20,.9);border:1px solid rgba(255,255,255,.28);border-right:0;border-radius:6px 0 0 6px;padding:9px 2px;box-shadow:0 1px 6px rgba(0,0,0,.25)}
</style>`;
  // Tabs: the only behaviour kept. Panels are found through aria-controls, deep links use #<tab>.
  const js = `<script>
(function(){var t=[].slice.call(document.querySelectorAll(${JSON.stringify(cfg.tabs || "[role=tab]")}));if(!t.length)return;
function key(b){return b.getAttribute("data-tab")||b.getAttribute("data-v")||b.getAttribute("aria-controls")}
var sub=document.querySelector(${JSON.stringify((cfg.tabSubtitle && cfg.tabSubtitle.target) || "#none")});
function show(b,f){t.forEach(function(x){var on=x===b,p=document.getElementById(x.getAttribute("aria-controls"));x.setAttribute("aria-selected",on?"true":"false");x.setAttribute("tabindex",on?"0":"-1");x.classList.toggle("on",on);if(p)p.hidden=!on});if(sub&&b.getAttribute("data-sub"))sub.textContent=b.getAttribute("data-sub");if(f)b.focus()}
t.forEach(function(b,i){b.addEventListener("click",function(){show(b);try{history.replaceState(null,"","#"+key(b))}catch(e){}});b.addEventListener("keydown",function(e){var k=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(k){e.preventDefault();show(t[(i+k+t.length)%t.length],true)}})});
var h=location.hash.slice(1);t.forEach(function(b){if(h&&key(b)===h)show(b)})})();
</script>`;
  return `${css}\n<div class="demo-badge" role="note">Demo — sample data</div>\n${js}`;
}
