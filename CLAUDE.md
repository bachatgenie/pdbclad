# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also read **CLAUDE_CONTEXT.md** — it has deployment details, env vars, credentials, the full schema reference, and the phase roadmap (see also PLAN.md). Keep both files updated when the architecture or roadmap changes.

## What This Is

PDBclad is a gamified personal life dashboard (second brain / life OS) built by Avadh. Tracks todos, habits, projects (with PARA areas), life-admin vault items, and activity logs, with an XP/level/streak reward system. Production runs on Vercel + Neon PostgreSQL at https://dashboard.vibedash.uk; pushing to `master` auto-deploys.

## Commands

```bash
npm run dev          # dev server at http://localhost:3002 (port is hardcoded)
npm run build        # prisma generate + next build
npm run seed         # seed demo user (avadh@pdbclad.app / password123)
npm test             # Playwright tests (requires dev server already running — webServer is disabled in playwright.config.ts)
npx playwright test tests/e2e/areas.spec.ts   # single test file
npm run test:ui      # Playwright UI mode
```

### Database — two schemas

- `prisma/schema.prisma` — **PostgreSQL** (production/Neon). Used by default: `npm run db:push`, `db:migrate`, `db:studio`.
- `prisma/schema.dev.prisma` — **SQLite** mirror for local dev. Used via `npm run dev:push`, `dev:migrate`, `dev:generate`, `dev:studio`.

Any model change must be made in **both** schema files. Migrations are migration-first and production-safe (`prisma/migrations/`); `db:setup:prod` runs `migrate deploy`. Which database the app talks to is controlled by `DATABASE_URL` in `.env` (Neon URL or `file:./prisma/dev.db`).

## Architecture

Next.js 16 App Router + React 19 + Tailwind CSS 4 + Prisma 6 + NextAuth v5 (beta).

- **Server actions are the entire backend.** Nearly all mutations live in [src/lib/actions.ts](src/lib/actions.ts) (~1100 lines: todos, habits, projects, areas, milestones, subtasks, vault, XP awards, streaks). Auth actions are in `src/lib/auth-actions.ts`. The only REST endpoints are NextAuth (`src/app/api/auth/[...nextauth]/`) and an external logging API with API-key auth (`src/app/api/v1/log/`).
- **Pages are server components** under `src/app/(dashboard)/` that fetch via Prisma directly; interactive pieces are client components in `src/components/` that call server actions. `(auth)` route group holds login/signup (signup is gated by the `BETA_CODE` env var).
- **Gamification**: every action that earns XP calls into [src/lib/gamification.ts](src/lib/gamification.ts) (`XP_REWARDS`, `getLevelForXP`, `BADGES`). When adding a user-facing action, decide whether it awards XP and log it to `ActivityLog`.
- **Project progress is two-tier**: 50% from milestone completion + 50% from subtask completion, computed in server actions when milestones/subtasks toggle.
- **Auth**: NextAuth v5 — use `auth()` (not `getServerSession()`), Credentials provider + JWT, bcryptjs for passwords.
- **Styling**: Tailwind v4 — theme lives in `@theme {}` inside `src/app/globals.css` (there is no tailwind.config.js). Light theme only with CSS variables; `--color-xp-bar` (#0066cc blue) is the accent everywhere; `.glass` is the standard card class.

## UX Conventions (owner's preferences — follow them)

- Light theme only; never reintroduce dark/purple gradients.
- No confirm dialogs for small actions.
- Required form fields marked with a red `*`.
- Quantity habits use incremental +1/−1/custom logging, never all-or-nothing.
- Delete buttons hidden until hover (`group-hover`).
- Mobile-first thinking; homepage stays focused on "today".

## Gotchas

- Port 3002 is hardcoded in `package.json` and `NEXTAUTH_URL` — keep them in sync.
- Production `AUTH_SECRET` must differ from the dev default or the app throws on startup.
- On Windows, kill stuck Node with `Stop-Process -Id <PID> -Force`.
