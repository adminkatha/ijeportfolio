// Write content/media/demos.json from the built demos (run after build.mjs and verify.mjs).
//
//   node scripts/demos/manifest.mjs
//
// Sizes and poster dimensions are read from public/demos/<slug>/; the verdicts and evidence below
// were established from the saved pages (see docs/ASSETS.md). Clients are named by
// their own brand spelling; the reporting app is never named.
import fs from "node:fs";
import path from "node:path";
import { DASHBOARDS } from "./dashboards.mjs";
import { REPO, PUBLIC_DEMOS, dirSize } from "./lib.mjs";

function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length; ) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const TITLES = {
  "honey-tribe": "Honey Tribe performance dashboard (Shopify sales, Meta funnel, product & audience)",
  meloyelo: "MeloYelo performance dashboard (e-bike sales, riders & leads, inventory, marketing)",
  "riverdance-rv": "Riverdance RV Resort paid social & email dashboard",
  "rooming-house-expert": "Rooming House Expert marketing performance dashboard",
  "the-contract-shop": "The Contract Shop business quiz lead diagnostics",
};
const COMMON = "Rebuilt from the saved page: the dashboard's own code drew every KPI, table and SVG chart from a seeded synthetic data set at build time, then all scripts were stripped. Every figure (spend, revenue, leads, CPL, ROAS, CTR, CPC, CPM, impressions, reach, conversions, targets, percentages, deltas, axis ticks, tooltips) is sample data; chart shapes come from the sample series. Removed: trackers and external scripts, Google Fonts links (fonts self-hosted, OFL), preconnects, Sync/refresh and full-screen buttons, tooltips, lightboxes, comments, hover titles and creative IDs; the agency mark became a neutral 'Client reporting' wordmark. Filters, sorts and toggles are visible but inert; only the tabs work (tiny inline script, no network).";
const NOTES = {
  "honey-tribe": "Generic product names replace the real catalogue (several products carry first names). Campaign and ad names follow the agency's real naming convention (no IDs or names; third-party agency names dropped); the three ad cards keep their public ad copy. Ad images were not in the saved page, so cards show the dashboard's own headline tiles.",
  meloyelo: "Every selling agent is 'Agent #NN' (the real names are people). A Google Ads account number hard-coded in the dashboard is replaced by '(ID removed)'. The FY bike target, stock levels, production orders and email/Meta campaign figures are sample values; model, colour and region labels are the brand's public vocabulary.",
  "riverdance-rv": "Both saved views are tabs of this demo (#ads, #email). Ad names, campaign names and the five public ad creatives are kept (images renamed and resized). The email tab uses resort-only sample campaign, list and automation names: the shared email account also held other businesses' data and an account handle, none of which is shown.",
  "rooming-house-expert": "All four tabs render (three were empty in the saved page). One neutral ad-account label replaces the real account names. Campaign/ad names lose street names, property names and team first names; ad copy is shortened where it carried a street address or town. Two thumbnails are withheld (one printed a street address, one was blank) and show headline tiles. Email, lead-magnet and demographics labels are neutral placeholders.",
  "the-contract-shop": "Every quiz lead is a placeholder ('Lead #2059', handle 'lead2059@•••', not an email address); about 800 real names and emails in the saved page were removed before rendering. Email subject lines, campaign and ad names are the public marketing copy. Two creative images from the page are kept; the rest show the dashboard's 'no preview' tile.",
};

const demos = DASHBOARDS.map((cfg) => {
  const dir = path.join(PUBLIC_DEMOS, cfg.slug);
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const posterFile = path.join(dir, "preview.jpg");
  const dims = fs.existsSync(posterFile) ? jpegSize(posterFile) : null;
  return {
    slug: cfg.slug,
    client: cfg.client,
    title: TITLES[cfg.slug],
    src: `/demos/${cfg.slug}/index.html`,
    preview: { src: `/demos/${cfg.slug}/preview.jpg`, width: dims ? dims.width : null, height: dims ? dims.height : null },
    bytes: dirSize(dir),
    views: cfg.views,
    rendersOffline: true,
    hasScript: /<script\b/.test(html),
    notes: `${NOTES[cfg.slug]} ${COMMON}`,
  };
});

const manifest = {
  sameSystem: true,
  systemDescription:
    "One client-reporting system. Each client gets a single-page performance dashboard, served inside a client portal, built from the same parts: a branded header with a data-freshness stamp, period and KPI-benchmark controls with presets, KPI scorecards with deltas against the benchmark, time-series and breakdown charts drawn as inline SVG, sortable tables, a gallery of the ads that ran, and auto-written 'reading of the period' insight cards. Tabs and metrics are tailored to each business: e-commerce sales and the Meta funnel (Honey Tribe); e-bike sales, rider CRM, inventory and marketing (MeloYelo); Meta paid social and email (Riverdance RV Resort); Meta funnel, email, lead magnet and audience breakdowns (Rooming House Expert); quiz-lead diagnostics and Meta lead gen (The Contract Shop).",
  techEvidence: [
    "All six saved pages share one portal shell: identical inline scripts (same byte lengths), stylesheet and element ids; each page embeds the client's dashboard in an iframe, configured by an embed-URL setting on the portal page.",
    "Each dashboard is a single HTML page with inline CSS and hand-written vanilla JavaScript; code comments say it is kept ES5-safe for a pre-deploy esprima 4.x check (tools/_validate_dash_js.py).",
    "Charts are inline SVG generated by each page's own code (document.createElementNS in four dashboards, SVG markup strings in The Contract Shop); no <canvas>, no chart library and no framework markers (React, Vue, Next.js, Vite, webpack) appear in the saved dashboards.",
    "Every dashboard loads a relative data.json and its Sync button POSTs to a relative 'refresh' route; comments place the dashboards under a /d/<client>/ path of the portal and name a Python export job (job/main.py, job/activecampaign.py, job/build_local.py).",
    "Data sources named in the code and on screen: Shopify and Meta via Windsor.ai (Honey Tribe); sales lines, CRM stage history, production orders, Campaign Monitor and Meta via Windsor.ai (MeloYelo); Meta via Windsor.ai and ActiveCampaign (Riverdance RV Resort); Meta and ActiveCampaign (Rooming House Expert); the quiz feed, Klaviyo email data and SQL views over a shared Meta ingest (The Contract Shop).",
    "Comments and notes in three dashboards (Honey Tribe, MeloYelo, Rooming House Expert) refer to the earlier Looker reports whose metrics they reproduce or correct.",
    "Fonts are Google Fonts (Lato + EB Garamond; Inter + Archivo; Inter + Open Sans; Inter + Playfair Display); The Contract Shop uses a system font stack.",
    "The portal shell loads Google Tag Manager and gtag; The Contract Shop dashboard also loads gtag itself.",
  ],
  riverdance:
    "different views: the two saves are the same page with the same data, saved on its Paid Social tab (#ads) and its Email · ActiveCampaign tab (#email); each save already contained both tabs. They are kept as one demo with both views (/demos/riverdance-rv/index.html#email opens the Email view).",
  demos,
  excluded: [
    {
      source: "Riverdance RV (file 2/2)",
      reason: "Same document and data as file 1, saved with the Email tab open; that view is the Email tab of the riverdance-rv demo (#email), so a second demo would duplicate it.",
    },
  ],
};

const out = path.join(REPO, "content", "media", "demos.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${path.relative(REPO, out)}: ${demos.map((d) => `${d.slug} ${(d.bytes / 1024).toFixed(0)} KB`).join(", ")}`);
