# PDBclad — Claude Context File

> Read this file at the start of every new session before touching any code.
> Last updated: May 2026

---

## What Is This

PDBclad is a **gamified personal life dashboard** — a second brain and life OS built by Avadh. Single place to track todos, habits, projects, life admin, and more — with XP rewards for showing up consistently.

**Live URL:** https://dashboard.vibedash.uk
**GitHub:** https://github.com/bachatgenie/pdbclad (branch: `master`)
**Dev server:** `npm run dev` → http://localhost:3002

---

## Tech Stack

| Layer      | Tech                                             |
|------------|--------------------------------------------------|
| Framework  | **Next.js 16** (App Router, Server Actions)      |
| UI         | React 19, **Tailwind CSS 4**, Lucide icons       |
| ORM        | **Prisma 6** — PostgreSQL (Neon) prod, can use SQLite locally |
| Auth       | **NextAuth v5** (beta.30), Credentials + JWT     |
| Passwords  | bcryptjs                                         |
| Hosting    | **Vercel** (auto-deploy on git push to master)   |
| Database   | **Neon** (free PostgreSQL, serverless)           |
| Domain     | **dashboard.vibedash.uk** via Cloudflare CNAME → Vercel |

---

## Environment Variables

### Local `.env` (not in git)
```env
DATABASE_URL="postgresql://neondb_owner:...@ep-divine-dew-aq8soybq.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="pdbclad-dev-secret-change-in-production-abc123xyz"
NEXTAUTH_URL="http://localhost:3002"
```

### Vercel env vars (production)
```
DATABASE_URL   = <same Neon URL>
AUTH_SECRET    = <different from dev — set in Vercel dashboard>
NEXTAUTH_URL   = https://dashboard.vibedash.uk
BETA_CODE      = <invite code — e.g. VIBEDASH2025>
```

> ⚠️ `AUTH_SECRET` in production must NOT be the dev default or app will throw on startup.
> `BETA_CODE` controls who can register — change in Vercel dashboard, redeploy.

---

## Accounts & Credentials

| | |
|---|---|
| Demo login | `avadh@pdbclad.app` / `password123` |
| GitHub | `bachatgenie` account |
| Vercel | `Bachat's projects` team |
| Neon | Neon dashboard — project `pdbclad` |

---

## Project Structure

```
PDBclad/
├── prisma/
│   ├── schema.prisma       ← provider = "postgresql" (changed from sqlite)
│   ├── seed.ts             ← Creates demo user + sample data
│   └── dev.db              ← NOT in git, only for local sqlite dev
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      ← Login form + link to signup
│   │   │   └── signup/page.tsx     ← NEW: Beta signup with invite code
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          ← Sidebar + top bar + XP indicator
│   │   │   ├── page.tsx            ← Homepage (redesigned May 2026)
│   │   │   ├── todos/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── habits/page.tsx
│   │   │   ├── log/page.tsx
│   │   │   ├── vault/page.tsx
│   │   │   ├── vault/[category]/page.tsx
│   │   │   ├── stats/page.tsx
│   │   │   └── error.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── v1/log/route.ts     ← External API (API key auth)
│   │   ├── error.tsx
│   │   └── globals.css             ← Light theme CSS variables
│   ├── components/
│   │   ├── sidebar.tsx
│   │   ├── xp-bar.tsx
│   │   ├── command-bar.tsx
│   │   ├── todo-item.tsx
│   │   ├── add-todo-form.tsx
│   │   ├── habit-quick-toggle.tsx
│   │   ├── add-habit-form.tsx
│   │   ├── project-form.tsx
│   │   ├── project-card.tsx
│   │   ├── vault-item-card.tsx
│   │   ├── vault-item-form.tsx
│   │   └── [others...]
│   └── lib/
│       ├── actions.ts          ← ALL server actions (todos, habits, projects, vault, XP)
│       ├── auth.ts             ← NextAuth config
│       ├── auth-actions.ts     ← NEW: registerUser() for signup
│       ├── prisma.ts           ← Prisma client with DB validation
│       ├── gamification.ts     ← XP_REWARDS, getLevelForXP, BADGES
│       └── utils.ts            ← cn(), getGreeting(), timeAgo()
├── .env                        ← NOT in git
├── .env.example                ← Template
├── vercel.json                 ← Build config for Vercel
└── CLAUDE_CONTEXT.md           ← This file
```

---

## Setup on a New Machine

```bash
git clone https://github.com/bachatgenie/pdbclad.git
cd pdbclad
npm install
cp .env.example .env
# Edit .env — paste real Neon DATABASE_URL, set AUTH_SECRET, NEXTAUTH_URL=http://localhost:3002
npm run db:push      # push schema to Neon
npm run seed         # create demo user
npm run dev          # http://localhost:3002
```

---

## Database Schema (Key Models)

```
User        { id, email, passwordHash, name, xp, level }
Todo        { id, userId, title, priority, tags, dueDate, isLifetime, progress, progressMax, completedAt }
Project     { id, userId, title, description, status, progressPct, color }
Milestone   { id, projectId, title, order, completedAt }
Habit       { id, userId, title, type(good|bad), icon, unit(null=bool), targetValue }
HabitLog    { id, habitId, date, completed, value }  ← unique(habitId, date)
ActivityLog { id, userId, content, category, source, xpEarned, createdAt }
Badge       { id, userId, badgeType, unlockedAt }
Streak      { id, userId, type, currentCount, bestCount, lastDate }
VaultItem   { id, userId, category, title, data(JSON), tags, notes }
VaultReminder { id, vaultItemId, remindAt, repeat, isActive }
ApiKey      { id, userId, keyHash, label }
```

---

## XP Rewards (`src/lib/gamification.ts`)

```
COMPLETE_TODO: 10
COMPLETE_HABIT_GOOD: 15
LOG_BAD_HABIT_HONESTY: 2
LOG_ACTIVITY: 3
COMPLETE_MILESTONE: 50
DAILY_LOGIN_BASE: 5 (× streak days, capped at 50)
```

---

## Design System

Light theme. CSS variables in `globals.css`:
```
--color-bg-primary: #ffffff
--color-bg-secondary: #f8f9fa
--color-text-primary: #1a1a1a
--color-text-secondary: #666666
--color-text-muted: #999999
--color-border: rgba(0,0,0,0.08)
--color-xp-bar: #0066cc          ← blue, used everywhere for accent
--color-accent-green: #10b981
--color-accent-red: #ef4444
--color-accent-orange: #f97316
--color-accent-yellow: #f59e0b
```
`.glass` = white card with border + 1px shadow. No dark mode.

---

## What's DONE ✅

- [x] Auth: login / logout / JWT sessions
- [x] Beta signup page with `BETA_CODE` invite gate (`/signup`)
- [x] Dashboard homepage — redesigned (hero XP, stats strip, tasks+habits, projects, activity timeline)
- [x] Todos — CRUD, priorities, lifetime goals with progress
- [x] Habits — boolean + quantity, 7-day history, streaks
- [x] Projects — CRUD, milestones, auto % completion
- [x] Life Vault — 8 categories, reminders
- [x] Activity log page
- [x] Stats page
- [x] XP + level system
- [x] Login streak tracker
- [x] Command bar (quick log, Ctrl+K)
- [x] Error boundaries
- [x] Production deployment: Vercel + Neon + dashboard.vibedash.uk
- [x] Multi-user with invite-code gate

---

## What's NOT Done Yet ❌

### Phase 5 — Gamification Polish (HIGH priority)
- [ ] **Badge unlock logic** — check conditions after XP events, write to Badge table
- [ ] **Badge display UI** — profile/stats page showing earned badges
- [ ] **Level-up celebration** — full-screen modal/overlay when `user.level` increases
- [ ] **Daily quests** — auto-generated each day (complete 3 todos, log 5 habits etc.)
- [ ] **Habit heatmap** — GitHub-style yearly grid per habit

### Phase 6 — UX & Discovery (MEDIUM)
- [ ] **Universal search** — search across todos, vault, logs, projects
- [ ] **Weekly review flow** — summary + XP reward for reviewing the week
- [ ] **Subscription spend analytics** — total monthly/yearly from vault
- [ ] **PWA** — installable on phone, service worker
- [ ] **Onboarding flow** — first-time user setup (pick habits, set goals)

### Phase 7 — Integrations (LOWER)
- [ ] **Telegram bot** — log via Telegram message
- [ ] **API gateway** — `POST /api/v1/log` already exists, expand it

---

## Avadh's UX Preferences

- No confirm dialogs for small actions — just do it
- Light theme only — do NOT bring back dark/purple gradient
- Mark required fields with `*` (red asterisk)
- Quantity habits: incremental +1/-1/custom, not all-or-nothing
- Homepage: focused on today, not cluttered
- Delete buttons: hidden, show on hover (`group-hover`)
- Mobile-first thinking

---

## Deployment Workflow

```bash
# Make changes locally
git add -A
git commit -m "description"
git push
# Vercel auto-deploys in ~90 seconds → live at dashboard.vibedash.uk
```

To change beta code: Vercel → Settings → Environment Variables → `BETA_CODE` → update → Redeploy.

---

## Common Gotchas

1. `prisma/dev.db` not in git — run `npm run db:push && npm run seed` on fresh clone
2. Port hardcoded to **3002** in `package.json` and local `NEXTAUTH_URL`
3. Tailwind v4 uses `@theme {}` in CSS, NOT `tailwind.config.js`
4. NextAuth v5 uses `auth()` not `getServerSession()`
5. `AUTH_SECRET` in production must differ from dev default or app throws
6. `BETA_CODE` env var must be set in Vercel or signup returns "Beta closed"
7. Windows: use PowerShell `Stop-Process -Id <PID> -Force` to kill stuck Node
