@AGENTS.md

# CLAUDE.md: Ehjay Lorenzo portfolio

Project root: `C:\Users\Client\LPT\assets`. Run every command from here.
Read this file, `docs/PLAN.md` (the approved phase plan) and `docs/INTAKE.md` (the facts) before doing anything. Log decisions in `docs/DECISIONS.md`.
This Next.js version has breaking changes: read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see AGENTS.md).

## Who and what
- **Ehjay Lorenzo**, a Creative & Marketing Technologist (default title, editable in `content/data/profile.ts`). He makes the creative, runs the campaigns, and builds the systems (CRMs, dashboards) that track them.
- **The site** is an original, premium, dark, typographic portfolio. It must not look like a template or copy any existing portfolio.

## Non-negotiable rules
- **Never invent facts.** That includes projects, metrics, results, employers, clients, testimonials, dates and links. Missing data renders as a visible `[FILL IN: …]`, and every gap is listed in `docs/INTAKE.md`.
- **Never publish** his phone number or any salary/compensation information.
- **Sample campaigns** are labelled "Sample campaign" everywhere: cards, case pages, palette, OG images, llms.txt. Results are real numbers only.
- **Clients** are named only with permission (`client` field).
- **CRM/dashboard screenshots** must show no real customer or client data. Review each one before committing it and log the review in DECISIONS.md.
- **Content lives in `content/`**, never in components: `content/data/*.ts` (zod-validated), `content/work/<slug>.mdx`, `content/writing/*.mdx`.
- **No dependency outside `docs/PLAN.md` §7** without asking first. Re-check versions with `pnpm view <pkg> version` before installing.
- **Reference sites are patterns only.** Never fetch, copy or adapt their code, assets or text.
- **The Adham Dannaway teardown** (`C:\Users\Nico\teardowns\2026-10-05-adhamdannaway-com\`) is technique study only:
  - Copy none of its code, text, wording, timing values, measurements, layout, assets or screenshots.
  - Never copy its files here, and never run `bo-rebuild`.
- **The hero never splits his face.** His portrait is a normal photo in the identity column / About area.
- **No 3D in the hero.** If a phase prompt mentions a "3D hero object", apply it to the seam instead.
- **Media:**
  - Copy files from his asset folder into the project only when a phase needs them, and resize large images first.
  - Video is poster-first, with nothing loaded until play.
  - Video hosting needs approval (PLAN §5) before any video is added.

## Stack (pinned in PLAN §7)
- next 16.3.8 (App Router, Turbopack) with react 19.2.8, TypeScript 6.0.3 (strict), and Tailwind 4.3 with `@theme` tokens (no `tailwind.config.js`).
- zod, @content-collections/{core,mdx,next}, geist + next/font, next/og, cmdk, motion (`motion/react`), lenis (`lenis/react`, desktop only), @vercel/analytics + speed-insights (rendered only on Vercel).
- pnpm.
- Playwright drives the local Chrome for screenshots and tests.
- No GSAP, no 3D libraries, no UI kits.

## Design tokens (`app/globals.css` → `@theme`)
**Colors**
- bg `#0A0A0B`
- surface `#111214`
- surface-2 `#18191C`
- line `#232428`
- text `#F4F4F2`
- text-2 `#8B8D91`: the darkest grey allowed for real text
- text-3 `#6B6D71`: decorative or 24px+ text only
- accent `#C5F82A`: under about 5% of any screen
- accent-ink `#0A0A0B`

**Fonts**
- Bricolage Grotesque (display), Geist (body), JetBrains Mono (labels and the CODE side), all via next/font.
- Licenses go in `public/fonts/LICENSES/`.
- Never Inter, Roboto, Space Grotesk, Proxima Nova or Figtree for display.

**Type**
- display: `clamp(3.25rem, 2rem + 6vw, 8.5rem)`, line-height 0.92, letter-spacing -0.04em
- body: 1rem/1.65
- labels: 0.75rem mono, uppercase, letter-spacing 0.08em

**Layout and motion**
- Layout: 12 columns, 1280px max, 24px gutters (16px on mobile).
- Durations 150/250/450/800ms; ease-out `cubic-bezier(0.22, 1, 0.36, 1)`.
- Animate only `transform`, `opacity` and `--seam`. No scroll-jacking.
- Section labels: `[01] SELECTED WORK`, with the number in accent, a thin divider and a short note on the right. Numbers are computed from the visible sections.
- Grain: one static noise image at 0.035–0.06 opacity, never animated.

## The hero seam (CREATIVE | CODE)
- **What it shows:** the headline twice. CREATIVE is finished ad/editorial design; CODE is the same headline as code and structure.
- **Structure:** one client component, two stacked full-size layers clipped with `clip-path`, driven by one `--seam` % property. No sprites and no width-cropping.
- **Animation:** rAF with time-based damping; the loop stops when settled.
- **Clamping:** seam 8–92%, opacities 0–1, all in percent, correct at 2560px.
- **Modes:** cursor-follow (fine pointer ≥768), drag handle (touch ≥768), Creative/Code toggle (<768). They switch through `matchMedia` change listeners, both directions.
- **Accessibility:** the handle is a `role="slider"` (keys, `aria-valuenow`, `aria-label`); one real `h1`, with the CODE layer `aria-hidden`.
- **Reduced motion:** no easing or intro; the seam moves only with the handle, keys or toggle.
- **Loading:** no preloader; the hero text is the LCP element and never starts at `opacity: 0`. The intro is ≤ 800ms.

## Avoid
- logo walls
- skill bars
- heavy glassmorphism
- purple gradients
- Matrix rain
- a fake terminal as navigation
- particle overload or too much animation
- preloaders
- long hero paragraphs
- 10+ weak pieces
- tech badges with no evidence
- "passionate" copy
- job-application wording
- lorem ipsum, stock photos, emoji icons
- 1:1 copies of any portfolio

## Done means
- **Build:** `pnpm typecheck`, `pnpm lint` and `pnpm build` pass, with zero console errors, 404s or hydration warnings.
- **Lighthouse on mobile** (home + one case study): Performance 90+; Accessibility, Best Practices and SEO 100.
- **Core Web Vitals:** LCP ≤ 2.5s (hero text), CLS ≤ 0.1, INP ≤ 200ms.
- **JavaScript:** ≤ 170KB gzipped up front.
- **The seam:** no idle frames, works across resizes, fully keyboard operable, correct at 2560px.
- **Accessibility:** WCAG 2.2 AA, keyboard reachable, visible focus ring, skip link.

## Workflow
- One phase at a time, following `docs/PLAN.md` §8. At the end of each phase:
  1. run `pnpm typecheck`, `pnpm lint` and `pnpm build`
  2. commit `phase-N: <summary>`
  3. run `pnpm screens` (1440/768/390 into `.screenshots/phase-N/`; it fails on console errors or 4xx/5xx responses)
  4. summarize what changed and what's left
  5. **stop and wait for approval**
- Never commit secrets. Ask before pushing to a remote or deploying.
