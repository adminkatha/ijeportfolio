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
