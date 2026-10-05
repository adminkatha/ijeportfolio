# PLAN: Ehjay Lorenzo portfolio

Approved 2026-10-05 with the corrections in "Decisions" below. Project root: `C:\Users\Client\LPT\assets`.
Facts come only from `docs/INTAKE.md`. Anything unanswered renders as a visible `[FILL IN: …]`.

## 1. Summary
- **Who:** Ehjay Lorenzo. He makes the creative (video, design, photo), runs the campaigns (Meta), and builds the systems (CRMs, dashboards) that track them.
  - Lead title (default, editable in data): **Creative & Marketing Technologist**.
  - Role line (default): **"I make the ads, and I build the systems that measure them."**
- **Site:** dark, typographic, restrained, original. Next.js 16.3 App Router, TS strict, Tailwind 4 `@theme` tokens, pnpm, Vercel.
- **Hero:** one memorable moment, a **CREATIVE | CODE** seam over the hero headline. It eases toward the cursor on desktop, drags on touch, and becomes a Creative / Code toggle under 768px. No 3D, and his face is never split.
- **Work:** four disciplines (Web & Systems = websites, CRMs and dashboards; Campaigns; Video; Creative). Files are grouped by client when a client appears in several folders. The homepage shows the 4 strongest pieces, ideally one per discipline. `/work` lists everything with a discipline filter; `/work/[slug]` is one page per piece with a template per discipline.
- **Honesty:**
  - Sample campaigns are labelled "Sample campaign" everywhere, and results are real numbers only.
  - Clients are named only with permission.
  - CRM and dashboard screenshots show no real customer data.
  - No phone number or salary information anywhere.
- **Content-driven:** typed and validated data in `content/data/*.ts`, plus MDX in `content/work` and `content/writing`.
- **Homepage order:** Hero → Selected Work → Capabilities → Experience → Now → Playground* → Writing* → Contact. (*Hidden with their nav links while empty; section numbers are computed from the visible sections, so there are no gaps.)
- **Interactions:**
  - Cmd/Ctrl+K command palette.
  - Developer Mode is deferred (Phase 13 is kept as a placeholder).
  - Motion is small: one-time reveals, Lenis on desktop only, everything off under reduced motion.
- **Budgets:**
  - Lighthouse mobile: Performance 90+, and 100 for Accessibility, Best Practices and SEO.
  - Core Web Vitals: LCP ≤ 2.5s (hero text), CLS ≤ 0.1, INP ≤ 200ms.
  - JS: ≤ 170KB gzipped up front.
- **Process:** one phase at a time. Each phase ends with typecheck, lint and build, a `phase-N: …` commit, screenshots at 1440/768/390, a summary, then a stop.
  - **2026-10-06 run:** no stops between phases; phases built in parallel by subagents in git worktrees and merged into `main`, which is pushed (after `pnpm check:push`) after each finished phase. Progress: `docs/PROGRESS.md`.

## 2. The hero: CREATIVE | CODE seam
**Subject A: the headline** ("EHJAY LORENZO" + role line), rendered twice and split by a vertical seam.

- **CREATIVE side:** finished ad/editorial design.
  - Display type at full size, the accent used like a print highlight, crop/registration marks, and a CTA ("See the work →").
  - It reads like a finished ad layout.
- **CODE side:** the same headline in the same position, shown as its code and structure.
  - Hairline-outlined glyphs, box-model outlines, and spacing redlines with values read from our real tokens.
  - The mono JSX/CSS that renders it, and the CTA shown as the tracked link it really is (the "measure them" half of the role line).
- **Mechanics** (we learn from the Adham teardown; we copy nothing from it):
  - One client component with two full-size stacked layers. Each is clipped with `clip-path: inset()` from one `--seam` custom property (percent of the container width). No sprites, no width-cropping, no layer resizing.
  - Eased with `requestAnimationFrame` using time-based damping. The loop stops once settled and restarts on input.
  - A single `setSeam()` clamps every source (pointer, drag, keyboard, intro) to 8–92%, and every derived opacity to 0–1.
  - All geometry is in percent of the container's measured box (cached and updated with ResizeObserver). A cursor outside the container pins to the nearest edge. Correct at 2560px.
- **Modes** (switched by `matchMedia` change listeners, both directions):
  - fine pointer and ≥768px: cursor-follow plus a drag handle
  - coarse pointer and ≥768px: drag handle
  - <768px: Creative / Code toggle
- **Accessibility:**
  - The handle is a focusable `role="slider"`: arrows, Home/End and PageUp/PageDown move it, it updates `aria-valuenow`/`aria-valuetext`, and it has a clear `aria-label`.
  - The toggle is a two-button group with `aria-pressed`.
  - One real `h1`; the CODE layer is `aria-hidden`.
- **Reduced motion:** no easing, no intro; the seam moves only with the handle, keyboard or toggle.
- **Loading:**
  - No preloader. The `h1` is in the first HTML and is the LCP element; it never starts at `opacity: 0`.
  - The intro (≤ 800ms, motion tokens) animates only the seam and the CODE annotations, and the seam is interactive immediately.
- **His portrait:** a normal photo in the identity column / About area.

## 3. Visual direction
- **Color:**
  - bg `#0A0A0B`, surfaces `#111214`/`#18191C`, line `#232428`.
  - text `#F4F4F2`; text-2 `#8B8D91` for real text; text-3 `#6B6D71` for decorative or 24px+ only.
  - Accent `#C5F82A` under about 5% of any screen: focus ring, active section number, link hover, the seam handle, the primary CTA, the "Sample campaign" tag outline. No gradients.
- **Type:**
  - Bricolage Grotesque, display only (the name huge, tight, uppercase).
  - Geist for body (16/1.65).
  - JetBrains Mono for labels, metadata and the whole CODE layer.
  - All loaded with next/font, self-hosted, with OFL licenses saved in `public/fonts/LICENSES/`.
- **One atmospheric system: construction lines.**
  - Hairline 12-column guides, fully visible on the CODE side and faint at section dividers.
  - A static grain layer at about 0.045 opacity.
  - This ties the "creative" and "systems" halves of his work together visually.
- **Grid:**
  - 12 columns, 1280px max width, 24/16px gutters. Hero full-bleed.
  - ≥1024px: a sticky identity column (portrait, name, title, numbered section index with active state, links, résumé, Now status) beside scrolling content.
  - Work is a list-style index plus cards.
- **Motion:**
  - Reveal once (450ms, 12px rise + fade, ease-out `cubic-bezier(0.22,1,0.36,1)`). Hovers 150ms.
  - Only transform, opacity and `--seam` animate. No parallax, no loops, no scroll-jacking.

## 4. Content model (`content/data/*.ts`, zod-validated at build time)

**Profile**
- name, title, roleLine, positioning, bio
- location, email
- links { github?, linkedin?, resume, other?[] }
- photo { src, alt }

**Project**
- slug, title, eyebrow
- discipline: `"web-systems" | "campaigns" | "video" | "creative"`
- sector? `"clothing" | "services" | "property"`
- summary, role, stack[] (tools, for non-dev work), result?
- metric? { value, label } (real numbers only)
- liveUrl?, githubUrl?
- client? { name } (only with permission)
- cover? { src, alt } (missing → typographic cover)
- gallery[] { src, width, height, alt, caption?, group? }
- videos[] { src, poster, width, height, title, description?, durationSec?, captions? } *(2026-10-06: several per project; width/height replace the aspect-ratio enum because screen recordings are ~2.2:1)*
- demos[] { slug, client, title, src: `/demos/<slug>/index.html`, preview, sampleData: true, note? } *(live dashboard demos; the schema requires a sample-data disclosure)*
- alsoIn[] (extra disciplines for the /work filter), disclosures[] (privacy notes shown on the page), related[] (slugs)
- isSample (boolean), featured, order, status `"shipped" | "in-progress"`, year?
- A validation rule: `isSample` work can't carry a client name, and metrics on samples must be labelled as sample data.

**Other types**
- **Experience:** { company, role, start, end | null, url?, bullets[], tech[] }
- **Capability:** { group: `"Creative" | "Marketing" | "Web"`, items[{ name, evidence, projectSlug? }] }. Items without evidence are rejected.
- **Now:** { building[{ name, description, url? }], learning[], updatedAt }
- **PlaygroundItem:** { title, description, href, media? }

**Case studies** (`content/work/<slug>.mdx`). A build-time check (in `lib/content.ts`) enforces each discipline's required H2s, in order:
- **Web & Systems:** Problem, Context, Constraints, Architecture, Implementation, Key technical decision, Result, What I learned
- **Campaigns:** Objective, Audience, Creative approach, Setup, Results, What I learned
- **Video / Creative:** a short brief, plus the gallery or video grid from the data file. MDX is optional.

**Posts:** `content/writing/*.mdx`. Hidden while empty.

## 5. Media policy
- **Images:** his real work. Large originals are resized *before* entering the repo: max 2400px on the long edge, quality around 82, AVIF/WebP/JPEG. I'll use Pillow, which is already on this machine, so no new project dependency. Files are copied in only when a phase needs them. `next/image` serves responsive sizes.
- **Privacy:** every CRM/dashboard screenshot is reviewed before it's committed. Real customer or client data gets redacted or replaced with demo-data screenshots, and the review is logged in DECISIONS.md.
- **Video:**
  - Vertical 9:16 first. The poster shows first; nothing loads until play (`preload="none"`, `src` set on click). Keyboard-operable controls, captions if he has them.
  - **Hosting proposal (needs your OK before any video is added):**

  | Option | Pros | Cons |
  |---|---|---|
  | **A. Compressed MP4 in the repo (recommended for short-form)** | Fastest first frame from the Vercel CDN; no third-party scripts or cookies; full control of the player; no new dependency | Repo grows. Needs ffmpeg (not installed: I'd ask before `winget install Gyan.FFmpeg`). Practical for clips ≤ about 60s at about 2–5MB each (720×1280, H.264, CRF about 26, faststart) |
  | B. Vercel Blob | Same `<video>` element, keeps the repo small; no project dependency if uploaded via dashboard/CLI | Storage/bandwidth billing; uploads managed outside git |
  | C. YouTube (unlisted) / Vimeo with click-to-load facade | Free hosting, adaptive streaming, good for long-form | Third-party player and cookies; the embed is heavy (the facade keeps it off the critical path); less design control |

  - Recommendation: **A** for short-form, switching to **B** if total video passes about 80MB. **C** only for long-form pieces.
  - **Decided 2026-10-06: A.** H.264 MP4, ≤1080p (720p for screen recordings), each < ~15 MB, total < ~80 MB, poster per video. Website recordings: audio stripped. Social videos: muted unless a note says the music is licensed or original (none does).
- **Privacy (2026-10-06):** customer names, emails, phones, addresses, appointment details, ad account IDs, keys and tokens are always removed. Client business figures appear only with written permission in a `notes.txt` (none exists): blurred in images, never quoted, and replaced with labelled sample values in the live demos (the only place sample numbers may appear). Files that can't be cleaned are left out and listed.
- **Live dashboards:** static offline demos in `public/demos/<slug>/` (no scripts from the original, no trackers, API calls, log-in links or forms; noindex), shown on project pages in a lazy sandboxed iframe with "Open full screen"; never loaded on the homepage.

## 6. File tree (target)
```
C:\Users\Client\LPT\assets
├─ CLAUDE.md (imports AGENTS.md) · AGENTS.md (Next.js agent rules, managed by next)
├─ docs/            PLAN.md · INTAKE.md · DECISIONS.md · PROGRESS.md · ASSETS.md · CONTACT-SETUP.md · DEPLOY.md · contact/apps-script.gs
├─ app/
│  ├─ layout.tsx · globals.css (@theme) · page.tsx · not-found.tsx
│  ├─ opengraph-image.tsx · sitemap.ts · robots.ts · llms.txt/route.ts
│  ├─ work/page.tsx · work/[slug]/{page,opengraph-image}.tsx
│  ├─ now/{page,opengraph-image}.tsx
│  ├─ writing/… · playground/…        (render notFound() while empty)
├─ components/
│  ├─ hero/        HeroSeam.tsx (the one client component) · seam.ts (pure clamp/mapping/damping)
│  ├─ layout/      Header · Footer · IdentityColumn · SkipLink · Grid
│  ├─ sections/    SelectedWork · Capabilities · Experience · Now · PlaygroundPreview · Writing · Contact
│  ├─ work/        ProjectCard · ProjectRow · DisciplineFilter (client) · templates/{WebSystems,Campaign,Showcase}
│  ├─ media/       Gallery · VideoPlayer (poster-first, client) · TypographicCover
│  ├─ command/     CommandButton · CommandPalette (loaded on demand)
│  ├─ motion/      Reveal · SmoothScroll (loaded on demand, desktop only) · MotionPreference
│  └─ ui/          SectionLabel · FillIn · SampleTag · Chip · ExternalLink
├─ content/
│  ├─ data/        profile · projects · experience · capabilities · now · playground · schema (.ts)
│  ├─ work/        <slug>.mdx
│  └─ writing/     (empty)
├─ content-collections.ts
├─ lib/            site.ts (SITE_URL) · seo.ts · og.tsx · format.ts
├─ public/         media/{img,video,poster}/ · demos/<slug>/ (live dashboard demos) · resume.pdf · fonts/LICENSES/ · grain.png
├─ content/media/  manifest.json · demos.json (generated by the media and demo pipelines)
├─ scripts/        screenshots.mjs · budget.mjs · grain.mjs · prepush-check.mjs · media/ · demos/
├─ run-local.bat   install if needed → build → start → open http://localhost:3000
├─ tests/e2e/      seam.spec.ts · smoke.spec.ts
└─ next.config.ts · tsconfig.json · eslint.config.mjs · postcss.config.mjs · .env.example · package.json
```

## 7. Dependencies (versions checked 2026-10-05; re-check with `pnpm view` before each install)
| Package | Version | Phase | Notes |
|---|---|---|---|
| next / eslint-config-next | 16.3.8 | 0 | |
| react / react-dom | 19.2.8 | 0 | the versions Next 16.3.8 installs (19.3.0 exists; we keep Next's tested pair) |
| typescript | **6.0.3** | 0 | typescript-eslint supports <6.1.0; `next build` uses the project-local `tsc` |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | 0 | |
| eslint | 9.39.5 | 0 | as scaffolded |
| playwright (dev) | 1.63.0 | 0 | screenshots + e2e; drives the local Chrome (no browser download) |
| zod | 4.6.5 | 2 | data validation + content-collections (Standard Schema) |
| @content-collections/core / mdx / next | 0.15.3 / 0.2.2 / 0.2.11 | 2 | |
| geist | 1.7.2 | 1 | Bricolage Grotesque + JetBrains Mono via next/font/google (self-hosted at build) |
| cmdk | 1.1.1 | 12 | loaded on demand |
| motion | 14.0.0 | 12/14 | only in on-demand chunks |
| lenis | 1.3.26 | 14 | desktop only; raf driven manually and stopped when idle |
| @vercel/analytics / @vercel/speed-insights | 2.0.1 / 2.0.0 | 16 | rendered only on Vercel (their script 404s locally) |
| ~~gsap, @gsap/react~~ | - | - | skipped (decision) |
| ~~@next/bundle-analyzer~~ | - | - | not installed: webpack-only, and we build with Turbopack. The built-in `next experimental-analyze` + `scripts/budget.mjs` do the job |

**JS budget plan:**
- Next + React baseline about 105KB gz, seam about 3KB, video player about 2KB.
- The palette and Lenis load on demand, and reveals use IntersectionObserver + CSS.
- Target ≤ 135KB gz up front.

## 8. Phases
Every phase ends with: `pnpm typecheck` + `pnpm lint` + `pnpm build` → commit `phase-N: …` → `pnpm screens` (1440/768/390, which also fails on console errors and 4xx/5xx responses) → summary → **stop**.

| # | Phase | Scope | Acceptance criteria |
|---|---|---|---|
| 0 | Scaffold | create-next-app 16.3.8 (App Router, TS strict, Turbopack, Tailwind 4, ESLint, AGENTS.md); pnpm; TS 6.0.3; git; scripts (`typecheck`, `lint`, `build`, `screens`); docs; screenshot script | typecheck, lint, build pass; placeholder page renders with no console errors or 404s; first commit |
| 1 | Foundations | `@theme` tokens, fonts + OFL licenses, grain, base styles, focus ring, skip link, Grid, SectionLabel | all text pairs ≥ 4.5:1 (text-3 only ≥ 24px); no font CLS (size-adjusted fallbacks); zero external font requests |
| 2 | Content model | zod schemas (incl. discipline, sector, gallery, video, isSample, client), data files from INTAKE, content-collections + per-discipline H2 check, FillIn, SampleTag, `SITE_URL` helper | invalid data or a missing template section fails the build with a clear message; no facts in components; every gap renders `[FILL IN: …]` |
| 3 | Shell | header (nav + ⌘K button), footer, sticky identity column with his portrait (resized), mobile nav, 404 | keyboard-only navigation; layout correct at 1440/1024/768/390; no horizontal scroll at 320; portrait has real alt text |
| 4 | Hero, static split | HeroSeam layers (CREATIVE / CODE) at a fixed 50%, static toggle <768, one `h1`, short CSS intro | `h1` is the LCP element; no preloader; layers align exactly at 390/768/1440/2560; CODE layer hidden from assistive tech |
| 5 | Selected Work | 4 featured pieces (one per discipline where possible), cards with label, title, summary, metric, stack, links; real covers (resized) or typographic fallback; Sample tags | data-driven; samples labelled; a missing metric hides cleanly |
| 6 | Capabilities + Experience | Creative / Marketing / Web groups with evidence lines; numbered timeline | every item has evidence or `[FILL IN]`; semantic lists and headings |
| 7 | Now + Contact (+ hidden sections) | Now (updatedAt) + `/now`; Contact "LET'S BUILD SOMETHING USEFUL." (email, links, résumé; no phone); Playground/Writing components that hide with their nav links while empty | empty sections are absent from DOM, nav and sitemap; section numbers have no gaps |
| 7a | Contact form → Google Sheets *(added 2026-10-06)* | form (name, email, company?, inquiry type, message), "Hire me" header button, server action → Apps Script web app (`CONTACT_WEBHOOK_URL`, `CONTACT_SECRET`), honeypot + min fill time + zod + length limits, Apps Script (secret check, formula escaping, header row, email notification), setup doc | accessible labels, inline errors, success message, privacy line; works without JS; "Email me instead" when env vars are missing; no secrets in the repo |
| 8 | Media | image pipeline, Gallery, poster-first VideoPlayer, hosting per the approved option (A), privacy review of every file; *(2026-10-06)* the dashboards as live offline demos, the privacy checks and the video compression | no video bytes before play; posters sized (no CLS); every file reviewed and logged in `docs/ASSETS.md`; videos < 15 MB each, < 80 MB total; demos make zero external requests and carry noindex |
| 9 | Work pages | `/work` with progressive-enhancement discipline filter (no-JS shows all; state in the URL); `/work/[slug]` with 3 templates; prev/next; writing/playground routes `notFound()` while empty | all slugs statically generated; unknown slug → 404; heading outline valid; filter keyboard-operable |
| 10 | SEO | per-route metadata, next/og image per page, sitemap, robots, llms.txt, JSON-LD (Person + CreativeWork), canonical from `SITE_URL` | every route has title, description, canonical and OG; local Lighthouse SEO 100 |
| 11 | **Seam interaction** | rAF easing, clamps, matchMedia modes, drag, keyboard slider, toggle, reduced motion, ≤ 800ms intro | zero rAF callbacks once settled; resize 390↔1440 switches modes both ways; keys update `aria-valuenow`; correct at 2560; seam always 8–92, opacities 0–1; INP ≤ 200ms while dragging |
| 12 | Command palette | cmdk on demand; groups Navigate / Work / Links / Actions (download résumé, copy email, toggle motion); ⌘K + header button; Esc returns focus | not in the initial bundle; all commands work; focus restored |
| 13 | *(Deferred)* Developer Mode | skipped for now; number kept so later prompts line up | - |
| 14 | Motion polish | reveals once, Lenis desktop-only (manual raf, idle stop), motion toggle persisted, reduced-motion path | no Lenis on touch or under reduced motion; content visible without JS; zero idle frames |
| 15 | QA | Lighthouse mobile (home + one case study), CWV, JS budget, axe, keyboard pass, console/404/hydration sweep, 2560 | 90/100/100/100; LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms; ≤ 170KB gz; zero errors |
| 16 | Deploy | *(2026-10-06: prep only)* GitHub origin + pushes, `run-local.bat`, `docs/DEPLOY.md` (import, env vars, domain), Analytics + Speed Insights rendered only on Vercel, clean-clone build. Later: the Vercel project, domain, rerun Phase 15 on the live URL | repo pushed; clean clone builds with no env; live URL passes Phase 15 (later) |

## 9. Decisions (2026-10-05)
- **Subject:** the site is for **Ehjay Lorenzo**. GrowthTrack is dropped unless he confirms it is his.
- **Seam:** subject A (headline), sides **CREATIVE | CODE**, toggle under 768px. Never split his face.
- **Dependencies:** zod and playwright (dev) approved. @next/bundle-analyzer approved but not installed (webpack-only; see §7). Skip GSAP. TypeScript 6.0.3.
- **Developer Mode** deferred. The command palette is kept.
- **Playground and Writing** hidden with their nav links while empty.
- **Domain:** from the `SITE_URL` env variable; `[FILL IN]` until decided. Deploy answers at Phase 16.

**2026-10-06** (details in DECISIONS.md): his files found in `ehjay-files/`; no `notes.txt` (so no client figures, muted social videos); portrait approved; client names allowed; the reporting app's brand removed everywhere; video Option A; live offline dashboard demos with sample data; contact form → Google Sheets (phase 7a); GitHub `adminkatha/ijeportfolio`; Vercel later; parallel build with subagents.
