# Ehjay Lorenzo: portfolio

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · pnpm 12.

- Rules for agents and contributors: [CLAUDE.md](CLAUDE.md) (+ [AGENTS.md](AGENTS.md), the Next.js agent rules)
- Phase plan: [docs/PLAN.md](docs/PLAN.md) · progress and resume point: [docs/PROGRESS.md](docs/PROGRESS.md)
- Facts and open questions: [docs/INTAKE.md](docs/INTAKE.md) · decision log: [docs/DECISIONS.md](docs/DECISIONS.md)
- His files, what each shows and what was done with it: [docs/ASSETS.md](docs/ASSETS.md)
- Contact form setup (Google Sheet): [docs/CONTACT-SETUP.md](docs/CONTACT-SETUP.md) · deploying to Vercel: [docs/DEPLOY.md](docs/DEPLOY.md)

## Run it on this PC
Double-click **`run-local.bat`**. It installs what's needed the first time, builds the site, starts it and opens
http://localhost:3000 (or the next free port if another program already uses 3000).

## Commands
```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm typecheck           # next typegen && tsc --noEmit
pnpm lint
pnpm build
pnpm start
pnpm screens --phase N [--routes /,/work]   # 1440/768/390 screenshots; fails on console errors, 4xx/5xx, any third-party request
pnpm a11y --routes /,/work                  # axe (WCAG 2.2 AA) at 1440 and 390
pnpm budget --routes /,/work                # gzipped JS loaded up front (limit 170 KB)
pnpm lighthouse --routes /,/work/sabbath-spa # mobile scores + LCP/CLS/TBT
pnpm inp                                    # slowest interaction (seam, palette, menu, filter)
pnpm fill-ins                               # every [FILL IN] still in content/
pnpm check:push                             # run before every git push
```
In Git Bash, prefix commands that pass `/routes` with `MSYS_NO_PATHCONV=1` (the scripts also undo the rewrite).

## Content
- Data: `content/data/*.ts` (zod-validated at build time: bad data fails the build with the file and field).
- Case studies: `content/work/<slug>.mdx` (Web & Systems and Campaigns pieces must have their required sections).
- Media: `public/media/` (made by `scripts/media/` from his originals), live dashboard demos: `public/demos/` (made by `scripts/demos/`).

## Environment
Copy `.env.example` to `.env.local`.
- `SITE_URL`: the production URL (falls back to Vercel's production domain, then localhost).
- `CONTACT_WEBHOOK_URL`, `CONTACT_SECRET`: the contact form (see `docs/CONTACT-SETUP.md`). Without them the site shows "Email me instead".
