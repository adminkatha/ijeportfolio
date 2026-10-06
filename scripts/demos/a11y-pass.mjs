// Accessibility pass for the demos, applied in place to public/demos/<slug>/index.html.
//
//   node scripts/demos/a11y-pass.mjs [--check] [slug ...]
//
// It post-processes a finished page and never touches its data: every figure, label, chart and image
// stays as it is. Only markup semantics and CSS change:
//  - landmarks: the dashboard body is the one <main> (per-tab <main>s become <div>s), tab bars outside
//    it become named regions, and the "Demo - sample data" label becomes an <aside>;
//  - headings: exactly one <h1> (the dashboard title; visually hidden when the header has no title on
//    every screen size) and no skipped levels (a visually hidden tab title opens any panel whose first
//    heading would skip one);
//  - tabs: a named role=tablist parent, an id per tab, role=tabpanel + aria-labelledby per panel (the
//    page's tab script already keeps aria-selected and tabindex in sync);
//  - scroll containers: tabindex=0 + role=region + aria-label, so they can be scrolled from the keyboard;
//  - an empty table header gets visually hidden text;
//  - colour contrast: text that axe measures below 4.5:1 (3:1 for large text) is darkened (lightened on
//    dark backgrounds) in its own hue just enough to pass, through CSS rules keyed by data-c* attributes;
//    text dimmed with opacity is un-dimmed only as far as needed (data-o*). Rules for text inside a tab
//    are scoped to the tab's selected / unselected state.
// A retagged element keeps its exact look: every CSS selector naming the old or new tag is rewritten to
// match the same elements with the same specificity, and a layered rule restores the old tag's browser
// defaults. Before writing, the pass proves nothing else moved: identical text (apart from the new
// visually hidden labels), SVG, images and attributes, and identical boxes and type for every element at
// 1440, 1024, 768 and 390 px. The visible text of every tab, before and after, is diffed into
// <work>/a11y/. Idempotent: a page whose <html> carries data-a11y is left as it is. --check runs
// everything but writes nothing.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { DASHBOARDS } from "./dashboards.mjs";
import { PUBLIC_DEMOS, WORK, kb } from "./lib.mjs";

const ORIGIN = "http://a11y.invalid";
const DESKTOP = { tag: "1440", width: 1440, height: 900 };
const MOBILE = { tag: "390", width: 390, height: 844, mobile: true };
const PROOF_WIDTHS = [1440, 1024, 768]; // desktop context; the mobile context adds 390
const MAX_ROUNDS = 8;
const TABLIST_LABEL = "Dashboard sections";
const EMPTY_TH = "Blank";
const BADGE_LABEL = "Demo notice";
const SR_CSS = ".demo-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}";
// attributes the pass may add (anything else must stay exactly as it was)
const NEW_ATTRS = new Set(["role", "aria-label", "aria-labelledby", "tabindex", "id", "data-a11y", "data-a11y-was",
  "data-c", "data-c-on", "data-c-off", "data-b", "data-b-on", "data-b-off", "data-o", "data-o-on", "data-o-off"]);
// Chrome's default styles that differ between the tags the pass swaps (all of them are display:block)
const UA = {
  h1: { "font-size": "2em", "font-weight": "bold", "margin-block": "0.67em" },
  h2: { "font-size": "1.5em", "font-weight": "bold", "margin-block": "0.83em" },
  h3: { "font-size": "1.17em", "font-weight": "bold", "margin-block": "1em" },
  h4: { "font-size": "inherit", "font-weight": "bold", "margin-block": "1.33em" },
  h5: { "font-size": "0.83em", "font-weight": "bold", "margin-block": "1.67em" },
  h6: { "font-size": "0.67em", "font-weight": "bold", "margin-block": "2.33em" },
};
const UA_PLAIN = { "font-size": "inherit", "font-weight": "inherit", "margin-block": "0" };
const TYPES = { ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };

// ------------------------------------------------------------------------------------------ pass
export async function a11yPass(browser, cfg, { write = true, log = console.log } = {}) {
  const file = path.join(PUBLIC_DEMOS, cfg.slug, "index.html");
  const original = fs.readFileSync(file, "utf8");
  const reportDir = path.join(WORK, "a11y");
  fs.mkdirSync(reportDir, { recursive: true });
  if (/^<!DOCTYPE html>\s*<html\b[^>]*\sdata-a11y=/i.test(original)) {
    log(`${cfg.slug}: already has the accessibility pass (data-a11y on <html>), left as it is`);
    return { slug: cfg.slug, ok: true, skipped: true };
  }
  const a = cfg.a11y || {};

  // 0. a parse + serialise round trip must give back the exact file, so every byte the pass does not
  //    mean to change stays as it was
  {
    const { ctx, page } = await openPage(browser, cfg.slug, original, DESKTOP);
    const back = await serialize(page);
    await ctx.close();
    if (back !== original) throw new Error(`${cfg.slug}: a round trip alone changes the page (${firstDiff(original, back)})`);
  }

  // 1. scroll containers, at either screen size
  const scrollers = new Set();
  for (const vp of [DESKTOP, MOBILE]) {
    const { ctx, page } = await openPage(browser, cfg.slug, original, vp);
    for (const i of await page.evaluate(scrollCandidates)) scrollers.add(i);
    await ctx.close();
  }

  // 2. landmarks, headings, tabs, scroll regions, empty headers
  let base, did;
  {
    const { ctx, page } = await openPage(browser, cfg.slug, original, DESKTOP);
    did = await page.evaluate(structure, {
      scrollers: [...scrollers].sort((x, y) => x - y), tabs: cfg.tabs || "", views: cfg.views || [], h1: a.h1 || "",
      retag: a.retag || [], regions: a.regions || [], tablistLabel: TABLIST_LABEL, emptyTh: EMPTY_TH, badgeLabel: BADGE_LABEL,
    });
    base = await serialize(page);
    await ctx.close();
  }
  base = rewriteStyles(base, did.retags);
  const fixedCss = [SR_CSS, uaDefaultsCss(did.retags)].filter(Boolean).join("\n");
  let html = setA11yCss(base, fixedCss);

  // 3. colour contrast, measured by axe on every tab at both sizes until nothing fails
  const st = { elems: new Map(), groups: new Map(), pins: new Map() };
  let left = [], rounds = 0;
  for (;; rounds++) {
    left = await contrastFailures(browser, cfg, html);
    if (!left.length || rounds >= MAX_ROUNDS) break;
    if (!planPins(left, st)) break;
    html = await applyPins(browser, cfg, base, st.pins, fixedCss);
  }

  // 4. proof: nothing but the intended semantics and colours changed
  const proof = await prove(browser, cfg, original, html);
  const added = proof.textDiff.flatMap((d) => d.added), removed = proof.textDiff.flatMap((d) => d.removed);
  const contrast = summariseGroups(st);
  const ok = !proof.issues.length && !left.length;
  const report = {
    slug: cfg.slug, ok, written: false, bytesBefore: Buffer.byteLength(original), bytesAfter: Buffer.byteLength(html), rounds,
    changes: did, contrast, contrastLeft: left.map((f) => `${f.vp} tab${f.tab} ${f.desc || f.target} ${f.fg} on ${f.bg} = ${f.ratio}`),
    proof: { issues: proof.issues.slice(0, 50), issueCount: proof.issues.length, textDiff: proof.textDiff },
  };
  if (ok && write) { fs.writeFileSync(file, html); report.written = true; }
  fs.writeFileSync(path.join(reportDir, `${cfg.slug}.html`), html); // the candidate, for review
  fs.writeFileSync(path.join(reportDir, `${cfg.slug}.json`), JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(reportDir, `${cfg.slug}-text-diff.txt`), proof.textDiff.map((d) =>
    `== tab ${d.tab} (${d.view || ""}), visible text at 1440 px: ${d.removed.length} line(s) removed, ${d.added.length} added\n` +
    d.removed.map((l) => `- ${l}`).join("\n") + (d.removed.length ? "\n" : "") + d.added.map((l) => `+ ${l}`).join("\n")).join("\n\n") + "\n");

  log(`${ok ? "OK  " : "FAIL"} ${cfg.slug}: ${report.written ? "written" : write ? "NOT written" : "checked only"}, ${kb(report.bytesBefore)} -> ${kb(report.bytesAfter)}, contrast rounds ${rounds}`);
  log(`      retagged: ${summariseRetags(did.retags) || "none"} | headings added: ${did.headings.join("; ") || "none"}`);
  log(`      tabs: ${did.tabs.length} named + panels linked | regions: ${did.regions.join(", ") || "none"} | scroll regions: ${did.scrollers.length} | empty headers labelled: ${did.th}`);
  for (const c of contrast) log(`      contrast: ${c}`);
  log(`      visible text: ${removed.length} line(s) removed, ${added.length} added${added.length ? ` (${[...new Set(added)].map((l) => JSON.stringify(l.slice(0, 60))).join(", ")})` : ""}`);
  for (const s of report.contrastLeft.slice(0, 10)) log(`      STILL LOW CONTRAST ${s}`);
  for (const s of proof.issues.slice(0, 12)) log(`      PROOF ${s}`);
  return report;
}

// ------------------------------------------------------------------------------------------ pages
async function openPage(browser, slug, html, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const dir = path.join(PUBLIC_DEMOS, slug);
  const pageUrl = `${ORIGIN}/demos/${slug}/index.html`;
  const prefix = `${ORIGIN}/demos/${slug}/`;
  await ctx.route("**/*", (route) => {
    const url = route.request().url();
    if (url === pageUrl) return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html });
    if (url.startsWith(prefix)) {
      const f = path.normalize(path.join(dir, decodeURIComponent(new URL(url).pathname.slice(`/demos/${slug}/`.length))));
      if (f.startsWith(dir) && fs.existsSync(f) && fs.statSync(f).isFile()) {
        return route.fulfill({ status: 200, contentType: TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", body: fs.readFileSync(f) });
      }
      return route.fulfill({ status: 404, body: "" });
    }
    return route.abort(); // nothing leaves the machine
  });
  const page = await ctx.newPage();
  await page.goto(pageUrl, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => 0));
  return { ctx, page };
}

const serialize = (page) => page.evaluate(() => "<!DOCTYPE html>\n" + document.documentElement.outerHTML);

function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `at char ${i}: ${JSON.stringify(a.slice(Math.max(0, i - 40), i + 40))} vs ${JSON.stringify(b.slice(Math.max(0, i - 40), i + 40))}`;
}

// ------------------------------------------------------------------------------------------ in page
// (each of these runs inside the page, so it must not use anything from this module)

function scrollCandidates() {
  const out = [];
  Array.from(document.getElementsByTagName("*")).forEach((e, i) => {
    if (e === document.documentElement || e === document.body || e.namespaceURI !== "http://www.w3.org/1999/xhtml") return;
    if (/^(head|title|meta|link|style|script|select|option|textarea)$/.test(e.localName)) return;
    const cs = getComputedStyle(e);
    if (!/^(auto|scroll)$/.test(cs.overflowX) && !/^(auto|scroll)$/.test(cs.overflowY)) return;
    if (e.closest("[inert], [role=tablist]")) return;
    if (!e.textContent.trim() && !e.querySelector("img, svg, canvas, table")) return;
    out.push(i);
  });
  return out;
}

function structure(a) {
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const all = Array.from(document.getElementsByTagName("*"));
  const did = { retags: [], headings: [], regions: [], scrollers: [], tabs: [], th: 0 };

  // resolve every target before anything changes
  const heads = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).filter((h) => !h.closest("[inert]"));
  const labelFor = (e) => {
    const cap = e.querySelector("caption");
    let text = cap ? clean(cap.textContent) : "";
    if (!text) {
      let best = null;
      for (const h of heads) if (h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) best = h;
      text = best ? clean(best.textContent) : "Content";
    }
    if (text.length > 70) text = text.slice(0, 67).replace(/\s+\S*$/, "") + "…";
    return text + (e.querySelector("table") ? ", scrollable table" : ", scrollable");
  };
  const scrollers = a.scrollers.map((i) => all[i])
    .filter((e) => e && !e.closest("[inert]") && !e.hasAttribute("role") && !e.hasAttribute("tabindex"))
    .map((e) => [e, labelFor(e)]);
  const tabs = a.tabs ? Array.from(document.querySelectorAll(a.tabs)) : [];
  const retags = a.retag.map(([sel, tag]) => [Array.from(document.querySelectorAll(sel)), tag, sel]);
  const regions = a.regions.map(([sel, label]) => [Array.from(document.querySelectorAll(sel)), label, sel]);
  const badge = document.querySelector("body > div.demo-badge");
  const header = document.querySelector("body header");
  const emptyTh = Array.from(document.querySelectorAll("th")).filter((th) => !clean(th.textContent) && !th.closest("[inert]") &&
    !th.hasAttribute("aria-label") && !th.hasAttribute("aria-labelledby") && !th.querySelector("img[alt]:not([alt='']), svg"));
  for (const [els, , sel] of [...retags, ...regions]) if (!els.length) throw new Error(`accessibility selector matches nothing: ${sel}`);

  // the pass's own style sheet (its text is filled in afterwards)
  const st = document.createElement("style");
  st.id = "a11y-css";
  document.head.appendChild(st);

  // tabs: named tablist parent, ids, labelled panels
  if (tabs.length) {
    const list = tabs[0].parentElement;
    if (tabs.some((t) => t.parentElement !== list)) throw new Error("the tabs do not share one parent");
    if (!list.getAttribute("role")) list.setAttribute("role", "tablist");
    if (!list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby")) list.setAttribute("aria-label", a.tablistLabel);
    tabs.forEach((t, i) => {
      if (t.getAttribute("role") !== "tab") throw new Error("a tab without role=tab");
      if (!t.id) {
        const key = t.getAttribute("data-tab") || t.getAttribute("data-v") || String(i + 1);
        let id = "tabbtn-" + key, k = 2;
        while (document.getElementById(id)) id = "tabbtn-" + key + "-" + k++;
        t.id = id;
      }
      const p = document.getElementById(t.getAttribute("aria-controls"));
      if (!p) throw new Error("a tab without its panel: " + t.getAttribute("aria-controls"));
      if (!p.getAttribute("role")) p.setAttribute("role", "tabpanel");
      if (!p.hasAttribute("aria-labelledby")) p.setAttribute("aria-labelledby", t.id);
      did.tabs.push(t.id);
    });
  }

  // scroll containers become focusable, named regions
  const seen = new Map();
  for (const [e, label] of scrollers) {
    const n = (seen.get(label) || 0) + 1;
    seen.set(label, n);
    e.setAttribute("tabindex", "0");
    e.setAttribute("role", "region");
    e.setAttribute("aria-label", n > 1 ? `${label} ${n}` : label);
    did.scrollers.push(e.getAttribute("aria-label"));
  }

  // chrome outside the landmarks
  for (const [els, label] of regions) for (const e of els) {
    if (e.getAttribute("role")) continue;
    e.setAttribute("role", "region");
    e.setAttribute("aria-label", label);
    did.regions.push(label);
  }

  // empty table headers
  for (const th of emptyTh) {
    const s = document.createElement("span");
    s.className = "demo-sr";
    s.textContent = a.emptyTh;
    th.appendChild(s);
    did.th++;
  }

  // landmark and heading tags (the caller rewrites the CSS so each keeps its look)
  const retag = (el, tag) => {
    const nu = document.createElement(tag);
    for (const at of Array.from(el.attributes)) nu.setAttribute(at.name, at.value);
    nu.setAttribute("data-a11y-was", el.localName);
    while (el.firstChild) nu.appendChild(el.firstChild);
    el.replaceWith(nu);
    did.retags.push([el.localName, tag]);
    return nu;
  };
  for (const [els, tag] of retags) for (const e of els) retag(e, tag);
  if (badge) {
    const b = retag(badge, "aside");
    if (b.getAttribute("role") === "note") b.removeAttribute("role");
    b.setAttribute("aria-label", a.badgeLabel);
  }

  // exactly one h1
  if (a.h1) {
    if (!header) throw new Error("no <header> to hold the h1");
    const h = document.createElement("h1");
    h.className = "demo-sr";
    h.textContent = a.h1;
    header.insertBefore(h, header.firstChild);
    did.headings.push("h1 " + a.h1);
  }
  // a panel whose first heading would skip a level opens with its tab's name
  tabs.forEach((t, i) => {
    const p = document.getElementById(t.getAttribute("aria-controls"));
    const first = p.querySelector("h1, h2, h3, h4, h5, h6");
    if (!first || Number(first.localName.slice(1)) <= 2) return;
    const h = document.createElement("h2");
    h.className = "demo-sr";
    h.textContent = a.views[i] || clean(t.textContent);
    p.insertBefore(h, p.firstChild);
    did.headings.push("h2 " + h.textContent);
  });
  const h1s = document.querySelectorAll("h1");
  if (h1s.length !== 1) throw new Error("expected exactly one h1, found " + h1s.length);

  document.documentElement.setAttribute("data-a11y", "1");
  return did;
}

function contrastInfo(sels) {
  const all = Array.from(document.getElementsByTagName("*"));
  const index = new Map(all.map((e, i) => [e, i]));
  const desc = (e) => e.localName + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).join(".") : "");
  return sels.map((sel) => {
    let el = null;
    try { el = sel ? document.querySelector(sel) : null; } catch { el = null; }
    if (!el) return null;
    const chain = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const o = parseFloat(getComputedStyle(e).opacity);
      if (o < 1) chain.push({ idx: index.get(e), o, inTab: !!e.closest("[role=tab]") });
    }
    const tab = el.closest("[role=tab]");
    const cs = getComputedStyle(el);
    const ownBg = cs.backgroundImage === "none" && !/^rgba\(.*,\s*0\)$|^transparent$/.test(cs.backgroundColor) ? cs.backgroundColor : "";
    return { idx: index.get(el), color: cs.color, ownBg, chain, desc: desc(el), svg: !!el.closest("svg"),
      scope: tab ? (tab.getAttribute("aria-selected") === "true" ? "on" : "off") : "" };
  });
}

function prepareProof(tabsSel) {
  if (tabsSel) for (const t of document.querySelectorAll(tabsSel)) {
    const p = document.getElementById(t.getAttribute("aria-controls"));
    if (p) p.hidden = false;
  }
  for (const im of document.images) im.loading = "eager";
}

async function settleInPage() {
  await document.fonts.ready;
  const imgs = Array.from(document.images).filter((im) => im.getAttribute("src"));
  await Promise.race([
    Promise.all(imgs.map((im) => (im.complete ? 0 : new Promise((ok) => { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); })))),
    new Promise((ok) => setTimeout(ok, 6000)),
  ]);
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
}

function snapshot() {
  const PROPS = ["display", "position", "float", "box-sizing", "width", "height", "top", "left", "margin-top", "margin-right",
    "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width",
    "border-right-width", "border-bottom-width", "border-left-width", "font-family", "font-size", "font-weight", "font-style",
    "line-height", "letter-spacing", "word-spacing", "text-transform", "text-align", "text-indent", "white-space",
    "vertical-align", "visibility", "overflow-x", "overflow-y", "z-index", "flex-basis", "flex-grow", "flex-shrink",
    "grid-template-columns", "row-gap", "column-gap", "background-image", "text-decoration-line",
    "list-style-type", "transform", "content"];
  const COLOURS = ["color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
    "outline-color", "text-decoration-color", "fill", "stroke", "caret-color"];
  const skip = (e) => e.id === "a11y-css" || !!e.closest(".demo-sr");
  const pinned = (e) => { for (let x = e; x; x = x.parentElement) if (x.hasAttribute("data-c") || x.hasAttribute("data-c-on") || x.hasAttribute("data-c-off")) return true; return false; };
  const els = [];
  for (const e of Array.from(document.getElementsByTagName("*"))) {
    if (skip(e)) continue;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    els.push({
      tag: e.localName,
      attrs: Array.from(e.attributes).map((x) => [x.name, x.value]),
      rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(","),
      style: PROPS.map((p) => p + ":" + cs.getPropertyValue(p)).join("|"),
      colours: COLOURS.map((p) => cs.getPropertyValue(p)).join("|"),
      opacity: cs.opacity,
      bg: cs.backgroundColor,
      bgPinned: e.hasAttribute("data-b") || e.hasAttribute("data-b-on") || e.hasAttribute("data-b-off"),
      pinned: pinned(e),
      opPinned: e.hasAttribute("data-o") || e.hasAttribute("data-o-on") || e.hasAttribute("data-o-off"),
    });
  }
  const texts = [];
  const tw = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const p = n.parentElement;
    if (p && (p.closest(".demo-sr") || p.closest("script, style"))) continue;
    texts.push(n.nodeValue);
  }
  return { els, texts, svgs: Array.from(document.querySelectorAll("svg")).map((s) => s.outerHTML) };
}

// ------------------------------------------------------------------------------------------ contrast
async function contrastFailures(browser, cfg, html) {
  const out = [];
  for (const vp of [DESKTOP, MOBILE]) {
    const { ctx, page } = await openPage(browser, cfg.slug, html, vp);
    const tabs = cfg.tabs ? await page.locator(cfg.tabs).all() : [];
    for (let t = 0; t < Math.max(1, tabs.length); t++) {
      if (tabs.length) { await tabs[t].click(); await page.waitForTimeout(60); }
      const res = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      const nodes = res.violations.flatMap((v) => v.nodes);
      if (!nodes.length) continue;
      const info = await page.evaluate(contrastInfo, nodes.map((n) => (typeof n.target[0] === "string" ? n.target[0] : "")));
      nodes.forEach((n, k) => {
        const d = (n.any[0] && n.any[0].data) || {};
        out.push({ ...(info[k] || {}), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, need: parseFloat(d.expectedContrastRatio),
          vp: vp.tag, tab: t + 1, target: n.target.join(" ") });
      });
    }
    await ctx.close();
  }
  return out;
}

/* Turn axe's failures into pins. Elements are grouped by their colour before the pass (with tab scope,
   opacity and the ratio they need: 4.5:1, or 3:1 for large text), every measurement is kept, and a group is
   solved as a whole, so all text that shared a colour gets the same replacement: the smallest change, in
   the text's own hue, that passes everywhere. Returns whether anything changed. */
function planPins(fails, st) {
  const touched = new Set();
  for (const f of fails) {
    if (!f || f.idx == null || f.svg || !f.fg || !f.bg || !f.need) continue;
    const ekey = `${f.idx}|${f.scope}`;
    const opMul = f.chain.reduce((m, c) => m * c.o, 1);
    let e = st.elems.get(ekey);
    if (!e) {
      e = { idx: f.idx, scope: f.scope, gkey: `${fmtColour(parseColor(f.color))}|${f.scope}|${opMul.toFixed(2)}|${f.need}` };
      st.elems.set(ekey, e);
    }
    let g = st.groups.get(e.gkey);
    if (!g) {
      const [from, scope, , need] = e.gkey.split("|");
      g = { from: parseColor(from), scope, need: Number(need), members: new Map(), cases: [], tries: 0, descs: new Set(), result: "" };
      st.groups.set(e.gkey, g);
    }
    g.members.set(ekey, { idx: f.idx, scope: f.scope, chain: f.chain, ownBg: f.ownBg || "" });
    g.descs.add(f.desc);
    g.cases.push({ ekey, fg: parseColor(f.fg), bg: parseColor(f.bg), need: f.need, cur: parseColor(f.color), opMul,
      ownBg: f.ownBg ? parseColor(f.ownBg) : null });
    touched.add(e.gkey);
  }
  let changed = false;
  const set = (key, v) => { if (st.pins.get(key) !== v) { st.pins.set(key, v); changed = true; } };
  const opWant = new Map();
  for (const gkey of touched) {
    const g = st.groups.get(gkey);
    const margin = 0.04 + 0.1 * g.tries++; // a little more each time the model fell short
    const light = lum(g.from) > lum(g.cases[0].bg); // light text on a dark ground: lighten it, never flip it
    // 1. the text colour, same direction
    let col = solveColour(g.from, g.cases, margin, light ? 1 : -1);
    if (col) {
      g.result = fmtColour(col);
      for (const m of g.members.values()) set(`${m.idx}|c|${m.scope}`, g.result);
      continue;
    }
    // 2. light text on its own coloured chip: deepen the chip instead (same hue)
    const chips = [...new Set([...g.members.values()].map((m) => m.ownBg))];
    if (light && chips.length === 1 && chips[0] && g.cases.every((k) => k.opMul === 1 && k.cur.a === 1 && k.ownBg)) {
      const bg = solveBackground(parseColor(chips[0]), g.cases, margin);
      if (bg) {
        g.result = `background ${fmtColour(bg)}`;
        for (const m of g.members.values()) set(`${m.idx}|b|${m.scope}`, fmtColour(bg));
        continue;
      }
    }
    // 3. dimmed text: un-dim (innermost opacity first) only as far as needed; the colour follows next round
    if (g.cases.some((k) => k.opMul < 1)) {
      for (const m of g.members.values()) {
        const own = g.cases.filter((k) => k.ekey === `${m.idx}|${m.scope}`);
        const opMul = m.chain.reduce((p, c) => p * c.o, 1);
        if (!own.length || opMul >= 1) continue;
        const target = solveOpacity(own, opMul, margin + 0.06);
        const chain = m.chain.map((c) => ({ ...c }));
        for (let i = 0; i < chain.length; i++) {
          if (chain.reduce((p, c) => p * c.o, 1) >= target - 1e-9) break;
          const rest = chain.reduce((p, c, j) => (j === i ? p : p * c.o), 1);
          chain[i].o = Math.max(chain[i].o, Math.min(1, Math.ceil((target / rest) * 100) / 100));
        }
        chain.forEach((c, i) => {
          if (c.o <= m.chain[i].o) return;
          const key = `${c.idx}|o|${c.inTab ? m.scope : ""}`;
          opWant.set(key, Math.max(opWant.get(key) || 0, c.o));
        });
      }
      g.cases = []; // measured at the old opacity: measure again
      g.result = "opacity";
      continue;
    }
    // 4. last resort: the text colour in either direction
    col = solveColour(g.from, g.cases, margin, 0);
    if (col) {
      g.result = fmtColour(col);
      for (const m of g.members.values()) set(`${m.idx}|c|${m.scope}`, g.result);
    }
  }
  for (const [key, v] of opWant) if (!(st.pins.get(key) >= v)) { st.pins.set(key, v); changed = true; }
  return changed;
}

async function applyPins(browser, cfg, base, pins, fixedCss) {
  const plan = pinPlan(pins);
  const { ctx, page } = await openPage(browser, cfg.slug, base, DESKTOP);
  await page.evaluate((attrs) => {
    const all = document.getElementsByTagName("*");
    for (const p of attrs) all[p.idx].setAttribute(p.name, p.value);
  }, plan.attrs);
  const html = await serialize(page);
  await ctx.close();
  return setA11yCss(html, [fixedCss, plan.css].filter(Boolean).join("\n"));
}

/* Pins -> data-c / data-b / data-o attribute values and the CSS rules they key (one rule per value). */
function pinPlan(pins) {
  const groups = new Map();
  for (const [key, val] of pins) {
    const [idx, kind, scope] = key.split("|");
    const g = `${kind}|${scope}|${val}`;
    if (!groups.has(g)) groups.set(g, { kind, scope, val, idxs: [] });
    groups.get(g).idxs.push(Number(idx));
  }
  const attrs = [], css = [], counters = {};
  const sorted = [...groups.values()].sort((x, y) => `${x.kind}|${x.scope}`.localeCompare(`${y.kind}|${y.scope}`) || String(x.val).localeCompare(String(y.val)));
  for (const g of sorted) {
    const name = `data-${g.kind}${g.scope ? "-" + g.scope : ""}`;
    const n = (counters[name] = (counters[name] || 0) + 1);
    for (const idx of g.idxs.sort((x, y) => x - y)) attrs.push({ idx, name, value: String(n) });
    const decl = g.kind === "c" ? `color:${g.val}!important` : g.kind === "b" ? `background-color:${g.val}!important` : `opacity:${g.val}!important`;
    const own = `[${name}="${n}"]`;
    const sel = g.scope ? `[role=tab][aria-selected=${g.scope === "on" ? "true" : "false"}]` : "";
    css.push(`${g.scope ? `${sel}${own},${sel} ${own}` : own}{${decl}}`);
  }
  // layered !important beats the page's own !important rules whatever their specificity
  return { attrs, css: css.length ? `@layer a11y-contrast{\n${css.join("\n")}\n}` : "" };
}

function summariseGroups(st) {
  const out = [];
  for (const g of st.groups.values()) {
    if (!g.result) continue;
    const scope = g.scope ? ` in ${g.scope === "on" ? "selected" : "unselected"} tabs` : "";
    const what = g.result === "opacity" ? `un-dimmed (opacity ${[...g.members.values()].flatMap((m) => m.chain.map((c) => st.pins.get(`${c.idx}|o|${c.inTab ? m.scope : ""}`))).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join("/")})`
      : g.result.startsWith("background") ? `${g.result.replace("background ", "on a chip deepened to ")}` : `-> ${g.result}`;
    out.push({ n: g.members.size, text: `${fmtColour(g.from)}${scope}${g.need === 3 ? " (large text)" : ""} ${what} x${g.members.size} (${[...g.descs].slice(0, 3).join(", ")}${g.descs.size > 3 ? ", ..." : ""})` });
  }
  return out.sort((x, y) => y.n - x.n).map((x) => x.text);
}

// colour maths (WCAG relative luminance, as axe computes it)
function parseColor(s) {
  s = String(s || "").trim();
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.split("").map((c) => c + c).join("");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]) };
  throw new Error(`unsupported colour ${s}`);
}
const hex2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
const fmtColour = (c) => (c.a >= 1 ? `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}` : `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Math.round(c.a * 100) / 100})`);
const clamp = (v) => Math.max(0, Math.min(255, v));
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const contrast = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  if (!s) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255 };
}
const roundRgb = (c) => ({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) });

/* axe's measured foreground moves linearly with the text colour (alpha compositing):
   fg' = fg + opacity * ((a'*c' + (1-a')*bg) - (a*c + (1-a)*bg)), per measurement. */
function predict(k, rgb, a) {
  const ch = (x) => clamp(k.fg[x] + k.opMul * ((a * rgb[x] + (1 - a) * k.bg[x]) - (k.cur.a * k.cur[x] + (1 - k.cur.a) * k.bg[x])));
  return { r: ch("r"), g: ch("g"), b: ch("b") };
}

/* Smallest change of the original colour, in its own hue, that passes every measurement: alpha first
   (translucent text), then lightness, then both. dir: -1 darker only, 1 lighter only, 0 either. */
function solveColour(from, cases, margin, dir) {
  const pass = (rgb, a) => cases.every((k) => contrast(predict(k, rgb, a), k.bg) >= k.need + margin);
  if (from.a < 1) for (let a = Math.round(from.a * 100) + 1; a <= 100; a++) if (pass(from, a / 100)) return { r: from.r, g: from.g, b: from.b, a: a / 100 };
  const [h, s, l0] = rgbToHsl(from);
  const tryLightness = (a) => {
    for (let d = 0.002; d <= 1.0001; d += 0.002) for (const l of [l0 - d, l0 + d]) {
      if (l < 0 || l > 1 || (dir < 0 && l > l0) || (dir > 0 && l < l0)) continue;
      const rgb = roundRgb(hslToRgb(h, s, l));
      if (pass(rgb, a)) return { ...rgb, a };
    }
    return null;
  };
  return tryLightness(from.a) || (from.a < 1 ? tryLightness(1) : null);
}

/* A deeper shade of the element's own background (same hue and alpha) behind light text. */
function solveBackground(own, cases, margin) {
  const [h, s, l0] = rgbToHsl(own);
  for (let d = 0.002; d <= l0 + 0.0001; d += 0.002) {
    const rgb = roundRgb(hslToRgb(h, s, l0 - d));
    const ok = cases.every((k) => {
      const bg = { r: clamp(k.bg.r + own.a * (rgb.r - k.ownBg.r)), g: clamp(k.bg.g + own.a * (rgb.g - k.ownBg.g)), b: clamp(k.bg.b + own.a * (rgb.b - k.ownBg.b)) };
      return contrast(k.fg, bg) >= k.need + margin;
    });
    if (ok) return { ...rgb, a: own.a };
  }
  return null;
}

/* Smallest overall opacity at which the current colour passes (1 if none does). */
function solveOpacity(cases, opMul, margin) {
  for (let t = Math.round(opMul * 100) + 1; t <= 100; t++) {
    const f = t / 100 / opMul;
    const ok = cases.every((k) => contrast({ r: clamp(k.bg.r + f * (k.fg.r - k.bg.r)), g: clamp(k.bg.g + f * (k.fg.g - k.bg.g)), b: clamp(k.bg.b + f * (k.fg.b - k.bg.b)) }, k.bg) >= k.need + margin);
    if (ok) return t / 100;
  }
  return 1;
}

// ------------------------------------------------------------------------------------------ CSS
const uniqPairs = (pairs) => [...new Map(pairs.map((p) => [p.join(">"), p])).values()];
const summariseRetags = (pairs) => {
  const n = new Map();
  for (const p of pairs) n.set(p.join("->"), (n.get(p.join("->")) || 0) + 1);
  return [...n].map(([k, v]) => `${k}${v > 1 ? ` x${v}` : ""}`).join(", ");
};

/* The old tag's browser defaults, as a layered (lowest-priority author) rule on the retagged element. */
function uaDefaultsCss(retags) {
  const rules = [];
  for (const [from, to] of uniqPairs(retags)) {
    const a = UA[from] || UA_PLAIN, b = UA[to] || UA_PLAIN;
    const decl = Object.keys(a).filter((k) => a[k] !== b[k]).map((k) => `${k}:${a[k]}`);
    if (decl.length) rules.push(`:where(${to}[data-a11y-was="${from}"]){${decl.join(";")}}`);
  }
  return rules.length ? `@layer a11y-defaults{\n${rules.join("\n")}\n}` : "";
}

/* Rewrite type selectors so every rule matches exactly the elements it matched before the retags, with
   the same specificity: "h1" -> ":is(h1:where(:not([data-a11y-was])),:where([data-a11y-was="h1"]))". */
function rewriteStyles(html, retags) {
  const pairs = uniqPairs(retags);
  if (!pairs.length) return html;
  const repl = {};
  for (const t of new Set(pairs.flat())) {
    const into = pairs.some(([, to]) => to === t), outOf = pairs.some(([from]) => from === t);
    const self = into ? `${t}:where(:not([data-a11y-was]))` : t;
    repl[t] = outOf ? `:is(${self},:where([data-a11y-was="${t}"]))` : self;
  }
  return html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (m, open, css, close) =>
    (/\bid="a11y-css"/.test(open) ? m : open + mapRules(css, (sel) => rewriteSelector(sel, repl)) + close));
}

function setA11yCss(html, css) {
  const re = /(<style id="a11y-css">)[\s\S]*?(<\/style>)/;
  if (!re.test(html)) throw new Error("the pass's style element is missing");
  return html.replace(re, (m, open, close) => `${open}\n${css}\n${close}`);
}

/* Walk a style sheet; fn() rewrites the prelude of every style rule (inside @media/@supports too). */
function mapRules(css, fn) {
  const n = css.length;
  const skipString = (j) => { const q = css[j]; j++; while (j < n && css[j] !== q) { if (css[j] === "\\") j++; j++; } return j + 1; };
  const preludeEnd = (j) => {
    let depth = 0;
    for (; j < n; j++) {
      const ch = css[j];
      if (ch === '"' || ch === "'") { j = skipString(j) - 1; continue; }
      if (ch === "/" && css[j + 1] === "*") { const e = css.indexOf("*/", j + 2); j = e < 0 ? n : e + 1; continue; }
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      else if (depth === 0 && (ch === "{" || ch === ";")) return j;
    }
    return n;
  };
  const blockEnd = (j) => {
    let depth = 0;
    for (; j < n; j++) {
      const ch = css[j];
      if (ch === '"' || ch === "'") { j = skipString(j) - 1; continue; }
      if (ch === "/" && css[j + 1] === "*") { const e = css.indexOf("*/", j + 2); j = e < 0 ? n : e + 1; continue; }
      if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) return j + 1;
    }
    return n;
  };
  let out = "", i = 0;
  while (i < n) {
    const ch = css[i];
    if (/\s/.test(ch) || ch === "}" || ch === ";") { out += ch; i++; continue; }
    if (ch === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2), end = e < 0 ? n : e + 2; out += css.slice(i, end); i = end; continue; }
    const pe = preludeEnd(i);
    if (pe >= n) { out += css.slice(i); break; }
    if (css[pe] === ";") { out += css.slice(i, pe + 1); i = pe + 1; continue; }
    const be = blockEnd(pe);
    const prelude = css.slice(i, pe), body = css.slice(pe + 1, be - 1);
    if (prelude.trimStart().startsWith("@")) {
      const name = prelude.trim().slice(1).split(/[\s({]/)[0].toLowerCase();
      out += ["media", "supports", "container", "layer", "document", "scope"].includes(name) ? `${prelude}{${mapRules(body, fn)}}` : css.slice(i, be);
    } else {
      out += `${fn(prelude)}{${body}}`;
    }
    i = be;
  }
  return out;
}

/* Replace the type selectors named in repl wherever a compound selector starts. */
function rewriteSelector(sel, repl) {
  let out = "", i = 0, start = true;
  const n = sel.length;
  while (i < n) {
    const ch = sel[i];
    if (ch === "[") { // attribute selector, quotes honoured
      let j = i + 1;
      while (j < n && sel[j] !== "]") {
        if (sel[j] === '"' || sel[j] === "'") { const q = sel[j++]; while (j < n && sel[j] !== q) { if (sel[j] === "\\") j++; j++; } }
        j++;
      }
      out += sel.slice(i, j + 1); i = j + 1; start = false; continue;
    }
    if (ch === "\\") { out += sel.slice(i, i + 2); i += 2; start = false; continue; }
    if (/[\s>+~,(]/.test(ch)) { out += ch; i++; start = true; continue; }
    if (ch === "." || ch === "#" || ch === ":") { // class, id, pseudo: copy the name
      let j = i + 1;
      if (sel[j] === ":") j++;
      while (j < n && /[\w-]/.test(sel[j])) j++;
      out += sel.slice(i, j); i = j; start = false; continue;
    }
    if (start && /[a-zA-Z]/.test(ch)) {
      let j = i;
      while (j < n && /[\w-]/.test(sel[j])) j++;
      const word = sel.slice(i, j), key = word.toLowerCase();
      out += sel[j] !== "|" && Object.prototype.hasOwnProperty.call(repl, key) ? repl[key] : word;
      i = j; start = false; continue;
    }
    out += ch; i++; start = false;
  }
  return out;
}

// ------------------------------------------------------------------------------------------ proof
async function prove(browser, cfg, original, final) {
  const issues = [];
  for (const vp of [DESKTOP, MOBILE]) {
    const A = await openPage(browser, cfg.slug, original, vp), B = await openPage(browser, cfg.slug, final, vp);
    for (const P of [A, B]) await P.page.evaluate(prepareProof, cfg.tabs || "");
    for (const w of vp.mobile ? [vp.width] : PROOF_WIDTHS) {
      for (const P of [A, B]) {
        if (w !== vp.width) await P.page.setViewportSize({ width: w, height: vp.height });
        await P.page.evaluate(settleInPage);
      }
      issues.push(...compareSnapshots(await A.page.evaluate(snapshot), await B.page.evaluate(snapshot), `${w}px`));
    }
    await A.ctx.close();
    await B.ctx.close();
  }
  // the visible text of every tab, before and after (only the new hidden labels may differ)
  const textDiff = [];
  const A = await openPage(browser, cfg.slug, original, DESKTOP), B = await openPage(browser, cfg.slug, final, DESKTOP);
  const ta = cfg.tabs ? await A.page.locator(cfg.tabs).all() : [], tb = cfg.tabs ? await B.page.locator(cfg.tabs).all() : [];
  for (let t = 0; t < Math.max(1, ta.length); t++) {
    if (ta.length) { await ta[t].click(); await tb[t].click(); await A.page.waitForTimeout(60); await B.page.waitForTimeout(60); }
    const before = (await A.page.evaluate(() => document.body.innerText)).split("\n");
    const after = (await B.page.evaluate(() => document.body.innerText)).split("\n");
    textDiff.push({ tab: t + 1, view: (cfg.views || [])[t] || "", ...diffLines(before, after) });
  }
  await A.ctx.close();
  await B.ctx.close();
  return { issues, textDiff };
}

function compareSnapshots(a, b, where) {
  const issues = [];
  if (a.texts.length !== b.texts.length || a.texts.some((t, i) => t !== b.texts[i])) {
    const i = a.texts.findIndex((t, k) => t !== b.texts[k]);
    issues.push(`${where}: text differs at node ${i}: ${JSON.stringify(a.texts[i])} vs ${JSON.stringify(b.texts[i])}`);
  }
  if (a.svgs.length !== b.svgs.length || a.svgs.some((s, i) => s !== b.svgs[i])) issues.push(`${where}: SVG markup differs`);
  if (a.els.length !== b.els.length) { issues.push(`${where}: ${a.els.length} elements before, ${b.els.length} after`); return issues; }
  for (let i = 0; i < a.els.length; i++) {
    const x = a.els[i], y = b.els[i];
    const ya = new Map(y.attrs), was = ya.get("data-a11y-was");
    const name = `${where} <${x.tag}${x.attrs.filter(([k]) => k === "id" || k === "class").map(([k, v]) => ` ${k}="${v}"`).join("")}>`;
    if ((was || y.tag) !== x.tag) { issues.push(`${name}: became <${y.tag}> unexpectedly`); continue; }
    for (const [k, v] of x.attrs) {
      if (!ya.has(k)) { if (!(k === "role" && v === "note" && y.tag === "aside")) issues.push(`${name}: lost ${k}`); }
      else if (ya.get(k) !== v) issues.push(`${name}: ${k} changed`);
    }
    for (const [k] of y.attrs) if (!x.attrs.some(([m]) => m === k) && !NEW_ATTRS.has(k)) issues.push(`${name}: unexpected ${k}`);
    if (x.rect !== y.rect) issues.push(`${name}: box ${x.rect} -> ${y.rect}`);
    if (x.style !== y.style) {
      const p = x.style.split("|"), q = y.style.split("|");
      issues.push(`${name}: ${p.filter((s, k) => s !== q[k]).map((s) => `${s} -> ${q[p.indexOf(s)].split(":").slice(1).join(":")}`).join(", ")}`);
    }
    if (x.colours !== y.colours && !y.pinned) issues.push(`${name}: colour changed without a contrast pin`);
    if (x.opacity !== y.opacity && !y.opPinned) issues.push(`${name}: opacity changed without a contrast pin`);
    if (x.bg !== y.bg && !y.bgPinned) issues.push(`${name}: background changed without a contrast pin`);
  }
  return issues;
}

function diffLines(a, b) {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let e = 0;
  while (e < a.length - s && e < b.length - s && a[a.length - 1 - e] === b[b.length - 1 - e]) e++;
  const A = a.slice(s, a.length - e), B = b.slice(s, b.length - e);
  if (A.length * B.length > 2e7) return { removed: A, added: B };
  const L = Array.from({ length: A.length + 1 }, () => new Uint32Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const removed = [], added = [];
  let i = 0, j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) removed.push(A[i++]); else added.push(B[j++]);
  }
  while (i < A.length) removed.push(A[i++]);
  while (j < B.length) added.push(B[j++]);
  return { removed, added };
}

// ------------------------------------------------------------------------------------------ CLI (last, so every helper above is initialised)
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const argv = process.argv.slice(2);
  const only = argv.filter((a) => !a.startsWith("--"));
  const list = DASHBOARDS.filter((d) => !only.length || only.includes(d.slug));
  if (!list.length) { console.error(`No dashboard matches ${only.join(", ")}`); process.exit(2); }
  const browser = await chromium.launch({ channel: "chrome" });
  let failed = false;
  try {
    for (const cfg of list) if (!(await a11yPass(browser, cfg, { write: !argv.includes("--check") })).ok) failed = true;
  } finally {
    await browser.close();
  }
  process.exit(failed ? 1 : 0);
}
