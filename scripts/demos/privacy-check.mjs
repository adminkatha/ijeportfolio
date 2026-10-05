// Final privacy pass over the dashboard demo outputs.
//
//   node scripts/demos/privacy-check.mjs
//
// Scans public/demos/**, content/media/demos.json, docs/ASSETS.dashboards.md and scripts/demos/**
// for: the reporting-app name (detected at runtime from the source file names; joined or as single
// words), emails, phone-like numbers (same pattern as scripts/prepush-check.mjs), ad-account IDs,
// long digit runs, API keys/tokens/JWTs, private or app URLs, unclean asset file names.
// Then it compares every demo with its original saved page (see the block below for the rules):
// no shared 6+ digit figure, no shared run of three figures, no original KPI value in a KPI tile,
// no original email or name. Exit code 1 on any failure.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { DASHBOARDS } from "./dashboards.mjs";
import { REPO, PUBLIC_DEMOS, findSource, brandWordRe, brandPhraseRe, walk } from "./lib.mjs";

const failures = [];
const notes = [];
const fail = (rule, where) => failures.push(`${rule}: ${where}`);
const rel = (p) => path.relative(REPO, p).replace(/\\/g, "/");

const TEXT = /\.(html|css|js|mjs|json|txt|svg|md|py)$/i;
const files = [
  ...walk(PUBLIC_DEMOS),
  path.join(REPO, "content", "media", "demos.json"),
  path.join(REPO, "docs", "ASSETS.dashboards.md"),
  ...walk(path.join(REPO, "scripts", "demos")).filter((f) => !/__pycache__/.test(f)),
].filter((f) => fs.existsSync(f));

const PHRASE = brandPhraseRe();
const WORD = new RegExp(brandWordRe().source, "i");
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(?<![\w.#/-])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)\s?|\d{2,4}[\s.-])\d{3,4}[\s.-]\d{3,4}(?![\w.-])/;
const SECRETS = [
  ["Google API key", /AIza[0-9A-Za-z_-]{20,}/], ["Stripe-style key", /\b[sp]k_(live|test)_[0-9A-Za-z]{8,}/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/], ["Meta access token", /\bEAA[A-Za-z0-9]{30,}/],
  ["access token", /access[_]token/i], ["bearer token", /Bearer\s+[A-Za-z0-9._-]{12,}/], ["ad account ID", /\bact_\d{4,}/],
  ["GitHub token", /\bgh[pousr]_[0-9A-Za-z]{20,}/], ["Slack token", /\bxox[abprs]-/], ["private key", /PRIVATE KEY-{5}/],
  ["GA/GTM id", /\b(G-[A-Z0-9]{8,}|GTM-[A-Z0-9]{5,}|UA-\d{4,}-\d+)\b/],
];
const HOSTS = /(supabase|firebase|vercel\.app|docs\.google\.com|script\.google|googleapis\.com|gstatic\.com|fbcdn\.net|facebook\.com|googletagmanager|google-analytics|https?:\/\/[^\s"'<>]*windsor|vertexaisearch|\/creative-img\/|\bportal\.)/i;

for (const f of files) {
  const r = rel(f);
  const isDemo = r.startsWith("public/demos/");
  const isScript = r.startsWith("scripts/");
  if (PHRASE.test(path.basename(f)) || WORD.test(r)) fail("agency name in a file name", r);
  if (isDemo && !/^[a-z0-9][a-z0-9._-]*$/.test(path.basename(f))) fail("asset name not lowercase/space-free", r);
  if (isDemo && /\d{9,}/.test(path.basename(f))) fail("long digit run in a file name", r);
  if (!TEXT.test(f)) continue;
  let text = fs.readFileSync(f, "utf8");
  if (PHRASE.test(text)) fail("agency name (joined)", r);
  if (WORD.test(text)) fail("agency name (word)", `${r}: ${text.match(WORD)[0]}`);
  for (const [name, re] of SECRETS) if (re.test(text)) fail(name, `${r}: ${text.match(re)[0].slice(0, 40)}`);
  const emails = text.match(EMAIL) || [];
  for (const e of emails) if (!/\.(png|jpe?g|webp|avif|svg|woff2?)$/i.test(e)) fail("email address", `${r}: ${e}`);
  if (isScript) continue; // phone/host/digit rules apply to published content only
  const scan = text.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "");
  if (PHONE.test(scan)) fail("phone-like number", `${r}: ${scan.match(PHONE)[0]}`);
  if (isDemo) {
    if (HOSTS.test(scan)) fail("private/app/tracker host", `${r}: ${scan.match(HOSTS)[0]}`);
    const long = scan.match(/(?<![\d.])\d{9,}(?![\d.])/);
    if (long) fail("long digit run (ID?)", `${r}: ${long[0]}`);
    // street addresses: "6 Example Court", "12 Main St", and state + postcode ("VIC 3000", "CO 81637")
    const ADDR = /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Street|St|Road|Rd|Court|Ct|Avenue|Ave|Drive|Dr|Lane|Ln|Place|Pl|Crescent|Cres|Boulevard|Blvd|Parade|Pde|Terrace|Tce|Highway|Hwy|Close|Grove)\b|\b(?:VIC|NSW|QLD|TAS|ACT|NT|WA|SA)\s+\d{4}\b|\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/;
    const visible = scan.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
    if (ADDR.test(visible)) fail("street address / postcode", `${r}: ${visible.match(ADDR)[0]}`);
    if (/\.html$/.test(f)) {
      if (!/<meta name="robots" content="noindex, nofollow">/.test(text)) fail("missing noindex", r);
      if (/<script[^>]+src=/i.test(text)) fail("script with src", r);
      if (/<(?:link|img|iframe|source|video|audio)[^>]+(?:href|src)=["']?(?:https?:)?\/\//i.test(text)) fail("external resource", r);
      if (!/Demo — sample data/.test(text)) fail("missing demo label", r);
    }
  }
}

// ---------------------------------------------------------------- original vs demo
// Every figure in a demo is synthetic, but short numbers collide by chance (a 150-row table of
// four-digit dollar values shares a few with any other). So the comparison looks for what a leak
// would actually look like:
//  (a) any shared figure with 6+ significant digits (chance collisions are negligible),
//  (b) any run of 3 consecutive informative figures (3+ significant digits, not round) that appears
//      in the same order in both pages (a copied row, KPI strip or chart series),
//  (c) any original KPI-tile value inside a demo KPI tile,
//  plus every email address and the configured sensitive strings (people, accounts) of the original.
const FIG = /\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?[KMx%]?|\$?\d+(?:\.\d+)?[KMx%]?/g;
const bareOf = (tok) => tok.replace(/[$,KMx%]/g, "");
const sigOf = (tok) => bareOf(tok).replace(".", "").replace(/^0+/, "").length;
const informative = (tok) => {
  const bare = bareOf(tok);
  const n = Number(bare);
  if (!isFinite(n) || sigOf(tok) < 3) return false;
  if (/^\d{4}$/.test(tok) && n >= 1990 && n <= 2035) return false; // years
  if (Number.isInteger(n) && n >= 100 && n % 100 === 0) return false; // round ticks
  if (/%$/.test(tok) && n % 5 === 0) return false; // relative-axis ticks: 25.0% 50.0% 75.0% 100.0%
  return true;
};
const KPI_SEL = '[class*="kv"], [id^="kpi"], .kpi .value, .kpi .v, .cell .v, .bignum, .hero-num';

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ javaScriptEnabled: false });
async function textOf(file, sensitiveSel) {
  const html = fs.readFileSync(file, "utf8");
  await ctx.unroute("**/*").catch(() => {});
  await ctx.route("**/*", (r) => (r.request().url() === "http://check.invalid/" ? r.fulfill({ body: html, contentType: "text/html" }) : r.abort()));
  const page = await ctx.newPage();
  await page.goto("http://check.invalid/", { waitUntil: "domcontentloaded" });
  const out = await page.evaluate(({ sel, kpiSel }) => {
    // sensitive strings first (selects/options can hold names), then drop interactive chrome
    // (preset labels like "180d", period notes) so scaffolding is not compared as data
    const sens = [];
    for (const s of sel) document.querySelectorAll(s).forEach((e) => { const t = e.textContent.replace(/\s+/g, " ").trim(); if (t.length >= 3) sens.push(t); });
    document.querySelectorAll("script, style, noscript").forEach((e) => e.remove());
    const collect = () => {
      const parts = [];
      const w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) parts.push(w.currentNode.nodeValue);
      // attributes that can carry data (colours, geometry and class names are not data)
      document.querySelectorAll("*").forEach((el) => { for (const a of el.attributes) if (/^(alt|aria-label|aria-valuenow|aria-valuetext|value|placeholder|content|label|data-.*)$/.test(a.name)) parts.push(a.value); });
      return parts.join("\n");
    };
    const full = collect();
    document.querySelectorAll(".controls, #controls, button, select, [role=tablist]").forEach((e) => e.remove());
    const kpis = [...document.querySelectorAll(kpiSel)].map((e) => e.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { text: collect(), full, sens, kpis };
  }, { sel: sensitiveSel || [], kpiSel: KPI_SEL });
  await page.close();
  return out;
}

for (const cfg of DASHBOARDS) {
  const demo = path.join(PUBLIC_DEMOS, cfg.slug, "index.html");
  if (!fs.existsSync(demo)) { fail("demo missing", cfg.slug); continue; }
  const src = findSource(cfg.source);
  const orig = await textOf(src.inner, cfg.sensitive);
  const mine = await textOf(demo, []);
  const origToks = (orig.text.match(FIG) || []).filter(informative);
  const mineToks = (mine.text.match(FIG) || []).filter(informative);
  // (a) strong single tokens
  const strongReal = new Set(origToks.filter((t) => sigOf(t) >= 6).map(bareOf));
  const strongHits = [...new Set(mineToks.filter((t) => sigOf(t) >= 6 && strongReal.has(bareOf(t))))];
  for (const t of strongHits) fail("figure from the original (6+ digits)", `${cfg.slug}: ${t}`);
  // (b) ordered runs of three
  const gram = (arr, i) => { const g = arr.slice(i, i + 3).map(bareOf); return new Set(g).size === 3 ? g.join("|") : null; };
  const grams = new Set();
  for (let i = 0; i + 2 < origToks.length; i++) { const g = gram(origToks, i); if (g) grams.add(g); }
  let runs = 0;
  for (let i = 0; i + 2 < mineToks.length; i++) {
    const g = gram(mineToks, i);
    if (g && grams.has(g)) { runs++; if (runs <= 5) fail("run of original figures", `${cfg.slug}: ${mineToks.slice(i, i + 3).join(" ")}`); }
  }
  // (c) KPI tiles
  const kpiTok = (arr) => new Set(arr.flatMap((s) => s.match(FIG) || []).filter(informative).map(bareOf));
  const origK = kpiTok(orig.kpis);
  const kpiHits = [...kpiTok(mine.kpis)].filter((t) => origK.has(t));
  for (const t of kpiHits) fail("KPI value from the original", `${cfg.slug}: ${t}`);
  // emails + sensitive strings (names only: a 3+ letter word; "All …" options and allowed labels skipped)
  const origEmails = new Set((orig.full.match(EMAIL) || []).map((e) => e.toLowerCase()));
  for (const e of origEmails) if (mine.full.toLowerCase().includes(e)) fail("email from the original", `${cfg.slug}: ${e}`);
  const allow = new Set(cfg.sensitiveAllow || []);
  const sens = [...new Set(orig.sens)].filter((s) => /[A-Za-z]{3,}/.test(s) && !/^All\b/.test(s) && !/^\(/.test(s) && !allow.has(s));
  // long strings: plain substring; short ones (first names): whole word, not inside "Don't" or "Lead"
  const word = (s) => new RegExp(`(?<![A-Za-z'\u2019])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z'\u2019])`);
  for (const s of sens) if (s.length >= 8 ? mine.full.includes(s) : word(s).test(mine.full)) fail("sensitive string from the original", `${cfg.slug}: ${s.slice(0, 60)}`);
  // informational: chance collisions of single 4-5 digit tokens (expected, not a leak by themselves)
  const realSet = new Set(origToks.map(bareOf));
  const chance = new Set(mineToks.filter((t) => sigOf(t) >= 4 && realSet.has(bareOf(t))).map(bareOf)).size;
  notes.push(`${cfg.slug}: ${origToks.length} original figures vs ${mineToks.length} demo figures; 6+ digit matches ${strongHits.length}, shared runs of 3 ${runs}, KPI matches ${kpiHits.length} (of ${origK.size}); single 4-5 digit coincidences ${chance} (chance level); ${origEmails.size} original emails and ${sens.length} names checked`);
}
await browser.close();

for (const n of notes) console.log("  " + n);
if (failures.length) {
  console.error(`✗ privacy check failed (${failures.length}):`);
  for (const f of failures.slice(0, 200)) console.error("  - " + f);
  process.exit(1);
}
console.log(`✓ privacy check passed: ${files.length} files`);
