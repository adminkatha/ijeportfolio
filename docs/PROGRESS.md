# PROGRESS

Resume point for a fresh session: read this file, then `CLAUDE.md`, `docs/PLAN.md`, `docs/DECISIONS.md` and `docs/INTAKE.md`.
Run order for this build (user, 2026-10-06): finish the whole site without stopping between phases; stop only for GitHub sign-in, videos that can't fit the size limit, a new dependency that ships to visitors, or low context.

## Status (2026-10-06)

| Phase | State | Where |
|---|---|---|
| 0 Scaffold | ✅ committed + pushed | main |
| 1 Foundations | ✅ committed + pushed | main |
| 2 Content model | ✅ committed + pushed | main |
| 3 Shell | 🔄 site agent | worktree `../wt-site`, branch `agent/site` |
| 4 Hero, static split | 🔄 hero agent | `../wt-hero`, `agent/hero` |
| 5 Selected Work | 🔄 site agent | `agent/site` |
| 6 Capabilities + Experience | 🔄 site agent | `agent/site` |
| 7 Now + Contact section | 🔄 site agent | `agent/site` |
| 7a Contact form → Google Sheets | ✅ merged + pushed (38/38 form tests, 20/20 Apps Script tests) | main |
| 8 Media (components) | 🔄 site agent | `agent/site` |
| 8 Media: live dashboard demos | ✅ reviewed, committed + pushed | main |
| 8 Media: images + videos | ✅ reviewed, committed + pushed (41 images, 16 videos = 74.6 MB) | main |
| 9 Work pages | 🔄 site agent | `agent/site` |
| 10 SEO | ✅ merged + pushed (Lighthouse SEO 100) | main |
| 11 Seam interaction | 🔄 hero agent | `agent/hero` |
| 12 Command palette | 🔄 hero agent | `agent/hero` |
| 13 Developer Mode | ⏭ skipped (deferred) | - |
| 14 Motion polish | 🔄 hero agent | `agent/hero` |
| 15 QA | ⏳ after merges | main |
| 16 Deploy prep (GitHub + Vercel docs, run-local.bat) | ✅ merged + pushed; run-local.bat tested (falls back to :3001 when :3000 is busy); no Vercel deploy yet | main |

## How the parallel build works
- Phases 1–2 were built first on `main`; they define the tokens, the content API (`lib/content.ts`) and **interface stubs** (files marked `STUB`) so every branch compiles on its own.
- Each code agent works in its own git worktree (separate `.next`, ports 3301/3401/3501) and commits `phase-N: …` on its branch. Nobody else pushes: the orchestrator merges each branch into `main`, re-runs typecheck/lint/build/screens, runs `pnpm check:push`, and pushes.
- File ownership: hero agent = `components/hero|command|motion`, `lib/commands.ts`; contact agent = `components/contact`, `lib/contact`, `lib/seo.ts`, `lib/jsonld.ts`, `lib/og.tsx`, `app/sitemap.ts|robots.ts|llms.txt|*opengraph-image*`, `docs/contact`, `docs/CONTACT-SETUP.md`, `docs/DEPLOY.md`, `run-local.bat`, `.env.example`, `components/layout/VercelInsights.tsx`; site agent = everything else in `app/` and `components/`; orchestrator = `content/**`, `lib/content.ts`, `lib/site.ts`, `next.config.ts`, `package.json`, `scripts/**`, `docs/**` (except the contact/deploy docs).
- On merge conflicts in `app/page.tsx` / `app/layout.tsx`, take the site agent's version (the others only mounted their components there for testing).
- Media: `public/media/**`, `public/demos/**`, `content/media/*.json` and `docs/ASSETS.*.md` are produced in the main tree and committed only after the privacy review (every image looked at; demos grepped for names, emails, phones, IDs, tokens and real figures).

## Next steps
1. ✅ Done: media + demos reviewed and committed, projects.ts filled from `content/media/manifest.json` (regenerate with the scratch generator or edit by hand), case studies written from evidence, INTAKE.md rewritten, ASSETS.md merged. The site agent was told to `git merge main`.
2. Merge `agent/site`, `agent/hero`, `agent/contact` into `main` (resolving page/layout conflicts toward the site agent), re-run all checks, push after each.
3. Phase 15 QA on `main`: Lighthouse mobile (home + one case study), CWV, JS budget, axe, keyboard pass, 2560, console/404 sweep.
4. Final report: local run, GitHub link + last commit, results, every [FILL IN] with its question, every excluded file, the user's to-do (CONTACT-SETUP.md, DEPLOY.md).
5. Remove the worktrees (`git worktree remove ../wt-*`) and delete the merged `agent/*` branches.
