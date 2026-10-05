# DECISIONS

A log of design and engineering decisions, newest at the bottom of each section.

## Reference study: the Adham Dannaway "designer | coder" hero
Source: the bo-teardown at `C:\Users\Nico\teardowns\2026-10-05-adhamdannaway-com\` (study only). Nothing from it (code, text, wording, timing values, measurements, layout, assets, screenshots) is used in this project, and no teardown file is copied here.

**What we learned (the technique, in our own words)**
- **The illusion is two complete pictures drawn at identical framing**, layered on top of each other. Each layer reveals only part of its picture, and the two reveals always meet at one shared edge, the "seam". Moving that one edge is the whole effect.
- **One smoothed number drives everything.** The cursor sets a target, and a value chases it a fraction of the remaining distance per tick. That smoothing is what makes it feel physical rather than mechanical. The same number fades the text on the far side, so the side you're "in" dominates.
- **The intro sells the idea before any interaction:** the two halves arrive from opposite sides and meet.
- **Small screens get a static version**, because the effect depends on a mouse.

**His known bugs, and how we avoid each**
| His version | Ours |
|---|---|
| A preloader that requests a CSS gradient as an image → a 404 on every load | No preloader at all. Fonts are preloaded by next/font. `pnpm screens` fails the phase on any 4xx/5xx response. |
| jQuery loaded twice | No jQuery. Exactly one React (`pnpm why react`); the bundle is checked for duplicate packages. |
| The effect is decided once from the initial window width; resizing never toggles it | `matchMedia` change listeners switch modes in both directions and attach or detach listeners and the loop. Tested with a 390 → 1440 → 390 resize. |
| Unclamped values: opacities run negative and above 1, and the seam drifts on wide screens | One `setSeam()` clamps every input to 8–92%; derived opacities are clamped 0–1; geometry is in percent of the container's measured box, and the cursor outside the container pins to the edge. Tested at 2560px. |
| Also: listeners re-attached on every hover, layout measured on every mouse move, two `h1`s, hover-only (no keyboard or touch), nothing for reduced motion | Listeners attached once with cleanup; the box is cached via ResizeObserver; one `h1` with the CODE layer `aria-hidden`; a `role="slider"` handle plus a toggle; a reduced-motion path. |

**How ours differs (beyond the fixes)**
- **We split one live element, not images.** The CREATIVE side is the headline as finished ad/editorial design; the CODE side is the same headline as its code and structure. No photos, no likeness, no sprites.
- **We clip instead of resizing.** Two full-size stacked layers are clipped with `clip-path` from one `--seam` custom property. Nothing changes size, so there's no layout work per frame.
- **Our loop is rAF with time-based damping** that sleeps when settled; his runs a fixed-rate timer the whole time the pointer is inside.
- **Inputs:** cursor, drag handle, keyboard and a small-screen toggle, instead of mouse only.
- **No preloader, and the text is visible at first paint:** the headline is the LCP element and the seam works immediately. The intro (≤ 800ms) animates only the seam and the annotations.
- **His face is never split.** Ehjay's portrait is a normal photo in the identity column.
- **Layout, typography, color and timings are our own** (see PLAN §3 and the motion tokens).

## Log
- **2026-10-05: Subject corrected to Ehjay Lorenzo.** GrowthTrack (from old notes) is dropped unless confirmed.
- **2026-10-05: Seam = subject A (headline), CREATIVE | CODE**, with a Creative/Code toggle under 768px. A static 50/50 split would show half a headline per side at phone width, which is unreadable.
- **2026-10-05: TypeScript pinned to 6.0.3.** typescript-eslint (inside eslint-config-next) supports <6.1.0. Next 16.3 type-checks with the project-local `tsc`, so TS 6 is fully supported.
- **2026-10-05: React 19.2.8 kept**, the pair Next 16.3.8 installs and tests against, even though 19.3.0 exists.
- **2026-10-05: @next/bundle-analyzer not installed despite approval.** It is a webpack plugin and Next 16 builds with Turbopack. We use the built-in `next experimental-analyze` plus `scripts/budget.mjs` for the gzip budget.
- **2026-10-05: GSAP skipped. Developer Mode (Phase 13) deferred.** The command palette is kept.
- **2026-10-05: Playground and Writing hidden while empty.** Section numbers are computed from the visible sections, so there are no gaps.
- **2026-10-05: The domain comes from the `SITE_URL` env variable** (`.env.example`); `[FILL IN]` until decided.
- **2026-10-05: Playwright uses the locally installed Chrome** (`channel: "chrome"`), so no browser download is needed. Screenshots go to `.screenshots/` (gitignored).
- **2026-10-05: Video hosting is proposed (PLAN §5), not decided.** No video is added until approved. ffmpeg isn't installed yet.
- **2026-10-05: The asset folder `C:\Users\Nico\ehjay-assets\` was not found.** Only `Downloads\Ehjay.webp` (768×1024) exists; it awaits confirmation as his portrait.

### 2026-10-06: the "finish the site" run
- **His files are in `C:\Users\Client\LPT\ehjay-files\`** (campaigns, clothing, crm, dashboards, property, services, videos, website, photo). They stay outside the repo and are never modified; cleaned copies go into the project. Inventory: `docs/ASSETS.md`.
- **There is no `notes.txt` and no résumé anywhere.** So:
  - no client business figure (revenue, spend, leads, cost per lead, ROAS, CTR, CPM…) appears in text, and any in images is blurred;
  - the live dashboard demos replace every figure with realistic sample values, are labelled "Demo — sample data", and the project page says so; sample numbers appear nowhere else and are never presented as results;
  - social videos are muted (no proof the music is licensed or original); website screen recordings have their audio stripped;
  - the résumé link stays `[FILL IN]`.
- **Portrait approved** (`Downloads\Ehjay.webp` or `photo\ehjay.jpeg`, whichever is the better copy). Alt text: "Portrait of Ehjay Lorenzo".
- **Client names may be shown** (user, 2026-10-06), using each brand's own spelling from its logo or site.
- **The reporting app's own brand name is removed** from every name and title the site uses (page titles, project titles, demo file names, logos and footers inside the dashboards), and it appears nowhere in the site or the repo. Docs refer to those files by client name. `scripts/prepush-check.mjs` fails a push that contains it.
- **Grouping:** files are grouped by client when a client appears in several folders. Web & Systems now covers websites, CRMs and dashboards. Each website uses its screen recording as its video; "Visit live site" only when a URL is in a note or visible in the recording, otherwise `[FILL IN]`.
- **Live dashboards:** each saved dashboard becomes a static, offline, read-only demo at `public/demos/<slug>/` (all scripts, trackers, API calls, log-in links and forms removed; keys, tokens and private URLs scanned for and removed; `noindex` meta + `X-Robots-Tag`). If they are one system for several clients, they are one project ("Client reporting dashboards") with a demo per client. Project pages show them in a lazy, sandboxed iframe with an "Open full screen" link; the homepage never loads a demo.
- **Privacy rules applied before anything is committed:** customer names, emails, phones, addresses, appointment details, ad account IDs, API keys and tokens are always removed. A file that can't be cleaned safely is left out and listed in the final report.
- **Street addresses inside property ads** count as addresses: those creatives are left out or the address is blurred. **Advertised offers inside ads** (a nightly price, "approx. gross income per year") are public ad copy, not the client's business results, so they stay as part of the creative.
- **Video hosting: Option A** (compressed MP4 in the repo, PLAN §5), approved. ffmpeg 9.0.2 installed via winget. H.264, ≤1080p (720p for screen recordings), each file < ~15 MB with a poster image, total < ~80 MB.
- **Content model changes** (PLAN §4): `alsoIn` (a piece can appear under several disciplines in the /work filter; the primary discipline picks the template); `videos[]` instead of a single `video`, with `width`/`height` instead of the aspect-ratio enum (screen recordings are about 2.2:1); `demos[]` (always `sampleData: true`, and the schema requires a disclosure); `disclosures[]`; `related[]`.
- **The case-study H2 check lives in `lib/content.ts`**, not in the content-collections transform, because a transform error is only logged and would not fail `pnpm build`. Both failure modes (missing heading, invalid data) were tested and fail the build with the file and field named.
- **Capabilities list only items with evidence.** Waiting for evidence: photography/videography, same-day edits, content strategy + copywriting, email automation (ActiveCampaign).
- **Contact form → Google Sheets:** a server action posts to a Google Apps Script web app (`docs/contact/apps-script.gs`), configured by `CONTACT_WEBHOOK_URL` + `CONTACT_SECRET` (env only; the sheet link, IDs and URLs never enter the repo). Without them the form shows "Email me instead". Header gets a "Hire me" button → `/#contact`.
- **GitHub:** `origin` = `https://github.com/adminkatha/ijeportfolio.git` (public, was empty). The machine's GitHub CLI account was added as a collaborator by the owner and the invite was accepted on 2026-10-06. Every push runs `pnpm check:push` first (no `.env` files, nothing over 50 MB, `.screenshots/` ignored, no banned brand, secrets, sheet/script URLs, stray emails or phone numbers, demos noindexed).
- **Vercel comes later** (no deploy in this run). `SITE_URL` falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then localhost. `docs/DEPLOY.md` has the steps.
- **Phase numbering for the additions:** Contact form = **7a**; the dashboards, privacy checks and video work join **8 (Media)**; GitHub + Vercel prep is **16 (Deploy)** without the actual deploy.
- **Parallel build (user request: 5 subagents):** two asset agents (media; dashboards) and three code agents (site; hero + palette + motion; contact + SEO + deploy) in separate git worktrees. Phase commits are made on the agents' branches and merged into `main`, which is pushed after each merge. Interfaces between them are the `STUB` files from phase 2.
- **pnpm 12 blocks unknown build scripts:** esbuild's script is denied in `pnpm-workspace.yaml` (its binary comes from the optional platform package, verified working), like sharp and unrs-resolver.
- **`pnpm screens` also fails on any third-party request**, which proves the "zero external font requests" criterion and keeps trackers out.
- **next/image qualities** are an allow-list in Next 16: `[75, 82]`.
- **2026-10-06: Dashboard demos, privacy review (before commit).** All six saved dashboards are one reporting system → one project, "Client reporting dashboards", with five live demos (Honey Tribe, MeloYelo, Riverdance RV Resort, Rooming House Expert, The Contract Shop). The two Riverdance files are the same page saved on two tabs → one demo with both tabs (`#email`).
  - **How the sample data was made:** each dashboard's own code drew every KPI, table, chart and insight from a seeded synthetic `data.json` at build time; then every script was stripped except a tiny tab switcher. Chart shapes therefore come from sample series, not the clients' data. Details and re-run steps: `docs/ASSETS.md` (dashboards section), `scripts/demos/`.
  - **Real data found and removed:** about 800 lead names and emails (The Contract Shop → "Lead #NNNN"); selling agents' names (MeloYelo → "Agent #NN"); a Google Ads account number in code; ad-account names (one a person's), street names, property names and team first names in Rooming House Expert's campaign names and ad copy; other businesses' lists and an account handle in Riverdance's email account; trackers (GTM/gtag). The reporting brand's logo became a neutral "Client reporting" wordmark. Withheld: one Rooming House Expert thumbnail that printed a street address and another company's logo, and one blank one.
  - **Checks:** the demo pipeline's privacy check against the originals passed (no shared 6+ digit figure, no run of three figures, no original KPI value; 800 emails and 1,383 names absent in The Contract Shop, 149 in MeloYelo, 75 in Rooming House Expert, 57 in Riverdance); `pnpm check:push` over all 67 files passed; every image asset (logos, public ad creatives) and every poster was looked at; demo text spot-checked. Served by Next: zero console errors, 404s or external requests at 1440/768/390, `X-Robots-Tag: noindex, nofollow` plus the robots meta.
  - **Limits:** the demos are static (tabs work; filters, sorting and tooltips are visible but inert). Some ad images weren't in the saved pages (fallback tiles shown).
  - **Evidence for the case study** comes from the dashboards' own code: vanilla JavaScript kept ES5-safe (esprima check before deploy), inline-SVG charts, a Python export job writing `data.json`, sources named in code (Windsor.ai for Meta/Shopify, ActiveCampaign, Campaign Monitor, Klaviyo), and comments that compare metrics with earlier Looker reports.
