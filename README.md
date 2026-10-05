# Ehjay Lorenzo: portfolio

Next.js 16 (App Router, Turbopack) · TypeScript 6 (strict) · Tailwind CSS 4 · pnpm.

- Rules for agents and contributors: [CLAUDE.md](CLAUDE.md) (+ [AGENTS.md](AGENTS.md), the Next.js agent rules)
- Phase plan: [docs/PLAN.md](docs/PLAN.md)
- Facts still needed: [docs/INTAKE.md](docs/INTAKE.md)
- Decision log: [docs/DECISIONS.md](docs/DECISIONS.md)

## Commands
```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm typecheck           # next typegen && tsc --noEmit
pnpm lint
pnpm build
pnpm screens --phase N   # after a build: screenshots at 1440/768/390 + error/404 check → .screenshots/
pnpm analyze             # Turbopack bundle analyzer
```

## Environment
Copy `.env.example` to `.env.local`. `SITE_URL` is the production URL (not decided yet).
