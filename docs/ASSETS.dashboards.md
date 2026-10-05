# ASSETS: client reporting dashboards

Source: `C:\Users\Client\LPT\ehjay-files\dashboards\` (read-only). Six saved web pages, each an `.html` plus a `_files` folder. Their file names end with the reporting app's name; that name is not used anywhere in this repo, and the dashboards are referred to by client name only.

Outputs (untracked, waiting for the orchestrator's review):
- `public/demos/<slug>/index.html`, `assets/`, `preview.jpg` (five demos)
- `content/media/demos.json`
- `scripts/demos/` (build, verify, privacy check, manifest, sample-data generators)

## Verdicts

**(a) Riverdance: two views of one page, kept as one demo.** The two Riverdance saves are the same document with the same data. The inner dashboards' scripts and CSS are byte-identical, and the markup differs only in which tab was open when it was saved: the Paid Social tab (`#ads`) in file 1, Email · ActiveCampaign (`#email`) in file 2. Each save already contains both tabs. So there is one demo, `riverdance-rv`, with both tabs working, and `/demos/riverdance-rv/index.html#email` opens the Email view. File 2 is listed as excluded in `demos.json`.

**(b) Same system: yes, so this is one project, "Client reporting dashboards", with five live demos.**
- All six pages share one portal shell: identical inline scripts (same byte lengths), stylesheet and element ids.
- Each page is the client workspace's Dashboard screen in admin view (an "admin edit" banner, a nav rail, notifications, an embed-URL setting). It embeds the client's own dashboard in an iframe; that embedded page is the actual dashboard.
- The five dashboards are built from the same parts:
  - a header with the client logo, an "Updated / Data through" stamp, Sync and a "prepared by" agency mark
  - period presets plus a separate KPI-benchmark range
  - Auto/Day/Week/Month grain and Relative/Absolute axis toggles
  - KPI scorecards with deltas against the benchmark
  - inline-SVG charts and sortable tables
  - an "ads that ran" gallery and auto-written "reading of the period" insight cards
  - the same `data.json` + `refresh` contract
- What differs per client is the tabs, the metrics and the colour theme (see the table below). No dashboard is a different system.

**(c) Tech evidence (from the files, nothing assumed).**
- Each dashboard is one HTML page with inline CSS and hand-written vanilla JavaScript. Code comments say it is kept ES5-safe for a pre-deploy esprima 4.x check (`tools/_validate_dash_js.py`).
- Charts are inline SVG drawn by each page's own code: `document.createElementNS` in four dashboards, SVG markup strings in The Contract Shop. The saved dashboards contain no `<canvas>`, no chart library and no framework markers (React, Vue, Next.js, Vite, webpack).
- Every dashboard fetches a relative `data.json` and POSTs to a relative `refresh` route (the Sync button). Comments place the dashboards under a `/d/<client>/` path of the portal and name a Python export job (`job/main.py`, `job/activecampaign.py`, `job/build_local.py`).
- Data sources named in the code and on screen:
  - Honey Tribe: Shopify and Meta via Windsor.ai
  - MeloYelo: sales lines, CRM stage history, production orders, Campaign Monitor, Meta via Windsor.ai
  - Riverdance RV Resort: Meta via Windsor.ai, ActiveCampaign
  - Rooming House Expert: Meta, ActiveCampaign
  - The Contract Shop: the quiz feed, Klaviyo email data, SQL views over a shared Meta ingest
- Comments and notes in Honey Tribe, MeloYelo and Rooming House Expert refer to the earlier Looker reports whose metrics they reproduce or correct.
- Fonts are Google Fonts:
  - Honey Tribe: Lato + EB Garamond
  - MeloYelo: Inter + Archivo
  - Riverdance RV Resort: Inter + Open Sans
  - Rooming House Expert: Inter + Playfair Display
  - The Contract Shop: system stack
- The portal shell loads Google Tag Manager and gtag. The Contract Shop's dashboard also loads gtag itself.

## Per file

| Saved page | Size | Client (brand spelling) | What the dashboard shows | Demo |
|---|---|---|---|---|
| Honey Tribe (file 1/1) | page 2.4 MB + folder 2 MB | **Honey Tribe**: the logo wordmark is set as "HONEYTRIBE" with "Bold prints. Modern cuts."; the title and alt text read "Honey Tribe" | 3 tabs. **Sales overview**: sales, customers, AOV, first-time/returning, units, metrics-over-time chart, weekly and month-to-date comparison, US state tile map, customers/AOV/sales chart, best sellers, new vs returning bars, insights. **Shopify × Meta**: funnel stages (awareness, consideration, conversion, efficiency) vs a KPI average, impression-to-purchase funnel, revenue vs spend, efficiency, frequency, ads that ran, campaign table, insights. **Product & audience**: sessions and orders by platform, category donut, category by month, best sellers by month, a generic US seasonal retail guide, age/gender and regions, sizes, order bands, weekday, units by state and month, traffic sources, insights. | `public/demos/honey-tribe/`: 604 KB (page 284 KB) |
| Melo Yelo (file 1/1) | page 3.7 MB + folder 37 MB | **MeloYelo**: logo "meloYELO E-BIKES", "just mad about e-bikes"; title and alt "MeloYelo" | 4 tabs, dark theme. **Sales performance**: FY bike target meter, FY-so-far comparison, KPI scorecards, metrics over time, month scoreboard, bike sales by model, customer-type donut, model and selling-agent leaderboards, product groups, insights. **Riders & leads**: rider community and growth, riders by source/agent/region/model, test-ride pipeline funnel, requests over time, speed-to-lead by agent, leads by region, current stage spread, insights. **Inventory & production**: stock KPIs, available stock by variant, runway by model, production orders, insights. **Marketing**: email (Campaign Monitor) KPIs and campaigns, Meta Ads KPIs, click funnel, leads and spend over time, campaign table, planned Google Ads/GA4 panes, insights. | `public/demos/meloyelo/`: 431 KB (page 176 KB) |
| Riverdance RV (file 1/2) | page 2.9 MB + folder 18 MB | **Riverdance RV Resort**: script logo "Riverdance RV Resort"; the file names say "Riverdance RV" | 2 tabs, green/cream theme. **Paid Social**: performance summary hero, KPIs, industry benchmark cards (public 2025–26 benchmarks with sources), spend and metrics chart, cumulative revenue vs spend, reach and engagement, CPC/CPM, frequency, impression-to-booking funnel, age/gender/state, creative gallery, campaign, creative and month tables, tracked bookings, takeaways. **Email · ActiveCampaign**: KPIs, one bar per campaign, lists and subscribers, contact base, every-email table, automations. | `public/demos/riverdance-rv/`: 897 KB (page 115 KB); both tabs |
| Riverdance RV (file 2/2) | page 2.9 MB + folder 18 MB | same | the same page saved on the Email tab | excluded: it is the Email tab of `riverdance-rv` |
| Rooming House Expert (file 1/1) | page 1.7 MB + folder 4 MB | **Rooming House Expert**: logo "ROOMING HOUSE EXPERT", "Turning underperforming property into cash-flow." | 4 tabs. **Meta funnel**: stage cards vs a KPI benchmark, budget context, leads/CPL/spend/clicks chart, funnel shape, KPI rail, ads that ran, campaign table, creative-fatigue table, insights. **Email performance**, **Lead magnet & sequence** and **Demographics & placement** were empty skeletons in the saved page (they draw on first open). The demo renders all four. | `public/demos/rooming-house-expert/`: 1.0 MB (page 145 KB) |
| The Contract Shop (file 1/1) | page 2.6 MB + folder 46 MB | **The Contract Shop**: logo "The CONTRACT .SHOP" | 2 views, teal theme. **Quiz diagnostic**: hero, KPIs, leads/sales/click-rate trend, cohort table, quiz leads list, emails grouped by subject, insights. **Lead Gen**: spend/leads/CPL hero and KPIs, trend chart, month-by-month blended funnel, campaigns, per-ad funnel heatmap, creative grid, insights. | `public/demos/the-contract-shop/`: 389 KB (page 208 KB) |

All five demos render offline, with a tiny inline tab script. Sizes include the 1440x900 poster (`preview.jpg`, about 120–135 KB each).

## How the demos were made

`node scripts/demos/build.mjs` builds every demo from the originals. For each dashboard it:
1. Extracts the client logo and the public ad thumbnails, resized (logo up to 200 px; creatives up to 720 px wide, JPEG/WebP quality 80) and renamed `creative-NN`. The original names were Meta creative IDs or ad titles.
2. Generates a **seeded synthetic `data.json`** in the shape the dashboard's code reads (`scripts/demos/gen/*.py`). Magnitudes are the same order as the original, never the same values, and ratios are consistent because the dashboard computes them itself.
3. Self-hosts the latin subset of the page's Google Fonts, with their SIL OFL texts in `assets/fonts/`. The Lato copyright line's contact address is written "name [at] domain", so no email pattern ships.
4. Loads the saved dashboard with JavaScript off and removes:
   - trackers, external scripts and font links
   - the elements the saved page had already filled with real data that the code appends to (select options, the retail guide, The Contract Shop's 800 lead rows, its email and ad tables)
5. Loads it on a fake origin with JavaScript on, a fixed clock and a seeded `Math.random`. Every request except the page, `data.json` and local assets is aborted. The dashboard's own code then draws every KPI, table and SVG chart from the sample data, so chart shapes come from the sample series. Tabs that draw on first open are clicked.
6. Sanitises the result:
   - strips all scripts, comments, event handlers, hover titles, creative IDs, Sync/full-screen buttons, tooltips and lightboxes
   - replaces the agency's "prepared by / managed by / built by" logo (and Riverdance's footer logo) with a neutral **Client reporting** wordmark
   - scrubs account-style IDs, 9+ digit runs and emails from text
   - unwraps external links
   - rounds SVG coordinates
   - makes filters, sorts and toggles `inert` (still visible)
   - prunes unused assets
   - adds `<meta name="robots" content="noindex, nofollow">`, the title "<Client> — Demo (sample data)", a small fixed **"Demo — sample data"** edge label in the bottom-left corner (it sits in the side gutter at 1440 and 390), and a tiny tab script (supports `#tab` deep links)

The build is deterministic: rebuilding gives byte-identical files.

## What was replaced or removed, per demo

- **All:**
  - every business figure is sample data: spend, revenue, sales, orders, leads, CPL, ROAS, CTR, CPC, CPM, impressions, reach, frequency, conversions, targets, stock, email counts and rates, percentages, deltas, axis ticks and insight text
  - dates and reporting windows are kept in the same form
  - "Updated" shows a fixed sample date
- **Honey Tribe:**
  - generic product names replace the real catalogue (some products carry first names)
  - campaign/ad names follow the real agency naming convention; names containing a third-party agency or first names were dropped
  - the three ad cards keep their public ad copy
  - the ad images were not in the saved page, so the cards show the dashboard's own headline tiles
- **MeloYelo:**
  - every selling agent is "Agent #NN"; 149 original agent names were checked and none appears
  - a Google Ads account number hard-coded in the dashboard's code is replaced by "(ID removed)"
  - model, colour, region, stage and source labels are the brand's public or generic vocabulary
  - email and Meta campaign names are clean or generic
- **Riverdance RV Resort:**
  - the ad names, campaign names and the four ad images (five cards; one had no image) are the resort's public creatives, renamed and resized
  - the footer's ad-account label is generic
  - the email account also held lists, automations and campaigns for other businesses plus an account handle: the demo shows resort-only sample names and no handle
- **Rooming House Expert:**
  - one neutral account label replaces the real ad-account names (one is a person's name)
  - campaign and ad names lose street names, property names and team members' first names
  - ad copy is shortened where it named a street address, town or listing figures
  - two thumbnails are withheld: one printed a street address and another company's logo, one was an empty frame; both show the dashboard's headline tile
  - the email, lead-magnet and demographics tabs use neutral labels (quiz answers, list, automation and template names), not the client's; those tabs were never rendered in the saved page
- **The Contract Shop:**
  - every quiz lead is a placeholder ("Lead #2059", handle "lead2059@•••", which is not an email address)
  - the 800 real names and emails in the saved page were removed before rendering, and the privacy check confirms none appears
  - email subject lines, campaign and ad names are the public marketing copy
  - two creative images embedded in the page are kept; the other ad images were expiring Meta CDN links, so those cards show the dashboard's "no preview" tile
  - the off-screen hover tooltip that widened the page by 125 px is removed

## Verification

`node scripts/demos/verify.mjs --shots <dir>` serves `public/` from a tiny local Node server and opens each demo in Chrome (Playwright) with every non-local request blocked and logged.

| Demo | External requests | Console/page errors | 4xx/5xx | Tabs | Horizontal overflow at 1440 / 390 |
|---|---|---|---|---|---|
| honey-tribe | 0 | 0 | 0 | 3 working | 0 / 0 |
| meloyelo | 0 | 0 | 0 | 4 working | 0 / 0 |
| riverdance-rv | 0 | 0 | 0 | 2 working (+ `#email`) | 0 / 0 |
| rooming-house-expert | 0 | 0 | 0 | 4 working | 0 / 0 |
| the-contract-shop | 0 | 0 | 0 | 2 working | 0 / 0 |

Screenshots at 1440x900 and 390x844 (every tab, full page) were taken and reviewed. `preview.jpg` is the 1440x900 top-of-page poster.

`node scripts/demos/privacy-check.mjs` passes. It checks:
- **Every output file** for the agency name (joined, with separators, or as single words), emails, phone-like numbers, ad-account IDs, 9+ digit runs, API keys, tokens, JWTs, GA/GTM IDs, private, app or tracker hosts, and street addresses or postcodes.
- **Each demo against its original:**
  - no shared figure with 6 or more significant digits
  - no run of three original figures in the same order
  - no original KPI value in a demo KPI tile
  - none of the original's emails (800 checked in The Contract Shop)
  - none of the original's names, accounts or address-bearing strings (1,383 checked in The Contract Shop, 149 in MeloYelo, 75 in Rooming House Expert, 57 in Riverdance)

Single four- or five-digit values do coincide by chance between two long tables (about 0–22 per demo, at chance level and in unrelated rows), so they are reported, not failed.

## Problems and limits

- **The demos are static.** Filters, date pickers, sorting, hover tooltips and click-to-filter do not work; only the tabs do. The controls are shown as they were, but inert.
- **Labels written as placeholders.** In Rooming House Expert's three lazily drawn tabs, and in Riverdance's email tab, the labels are placeholders. They are not the client's real campaign, list or template names.
- **Ad images.** Honey Tribe's ad images and most of The Contract Shop's were not in the saved pages, so those cards show the dashboards' own fallback tiles.
- **Latin-only fonts.** Fonts are self-hosted for the latin subset only, so rare glyphs (macrons, arrows) fall back to the system font, as they did for any glyph outside the original subsets.
- **Not used: portal-only images.** The `_files` folders also hold large ad and email images that belong to the portal's other sections, not to the dashboards:
  - MeloYelo: 19 PNGs, about 37 MB
  - The Contract Shop: about 30 images, about 46 MB
  - Riverdance: about 30 images, about 18 MB per copy
  - None is used here; they are a separate decision for the media work.
- **Logged elsewhere.** `CLAUDE.md` asks for each dashboard screenshot review to be logged in `docs/DECISIONS.md`. That file is outside this agent's outputs, so the orchestrator records the entry.

## Re-run

From the repo root, with the originals in place (override the path with `DASHBOARD_SRC`; temp files go to `DEMO_WORK`, default the OS temp folder):

```
node scripts/demos/build.mjs            # all demos, or: node scripts/demos/build.mjs meloyelo
node scripts/demos/verify.mjs --shots <screenshot folder>
node scripts/demos/privacy-check.mjs
node scripts/demos/manifest.mjs         # rewrites content/media/demos.json
```

It needs Python 3.12 + Pillow and Node with the repo's Playwright (local Chrome). Network is used once to download the self-hosted font files and their OFL texts; nothing contacts the dashboards' live services.
