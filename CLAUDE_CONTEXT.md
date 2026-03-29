# PDBclad — Claude Context File

> This file is for Claude (AI assistant) to read when starting a new session on this project.
> It describes what has been built, how it works, current state, and what's next.

---

## What Is This

PDBclad is a **gamified personal life dashboard** — a second brain and life operating system built by Avadh for personal use (and eventually a friend). Single place to track:

- Daily todos & lifetime bucket list goals
- Habits (good/bad, boolean/quantity, XP-rewarded)
- Projects with milestones and auto-calculated progress %
- Life Vault (subscriptions, insurance, car service, bills — stored, searchable, with reminders)
- Activity log (every action creates a feed entry)
- Gamification (XP, levels, streaks, badges)

**Core thesis**: Make it so frictionless to log and so rewarding to review that you crave coming back.

---

## Tech Stack

| Layer      | Tech                                             |
|------------|--------------------------------------------------|
| Framework  | **Next.js 16** (App Router, Server Actions)      |
| UI         | React 19, **Tailwind CSS 4**, Lucide icons       |
| ORM        | **Prisma 6** (SQLite dev / PostgreSQL prod)      |
| Auth       | **NextAuth v5** (beta.30), Credentials + JWT     |
| Passwords  | bcryptjs                                         |
| Port       | **3002** (hardcoded in package.json dev script)  |

---

## Project Structure

```
PDBclad/
├── prisma/
│   ├── schema.prisma       ← DB schema (SQLite dev, PostgreSQL prod)
│   ├── seed.ts             ← Creates demo user: avadh@pdbclad.app / password123
│   └── dev.db              ← SQLite DB (not in git — must run db:push + seed)
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          ← Sidebar + XP bar layout
│   │   │   ├── page.tsx            ← Homepage dashboard
│   │   │   ├── todos/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── habits/page.tsx
│   │   │   ├── log/page.tsx
│   │   │   ├── vault/page.tsx
│   │   │   ├── vault/[category]/page.tsx
│   │   │   ├── stats/page.tsx
│   │   │   └── error.tsx           ← Dashboard error boundary
│   │   ├── error.tsx               ← Global error boundary
│   │   ├── layout.tsx
│   │   └── globals.css             ← Theme variables + global styles
│   ├── components/
│   │   ├── sidebar.tsx
│   │   ├── xp-bar.tsx
│   │   ├── command-bar.tsx         ← Quick log bar at bottom
│   │   ├── todo-item.tsx
│   │   ├── add-todo-form.tsx
│   │   ├── habit-quick-toggle.tsx  ← Habit card: boolean OR quantity-based
│   │   ├── add-habit-form.tsx
│   │   ├── project-form.tsx        ← Create/edit project modal
│   │   ├── project-card.tsx        ← Project card with inline milestone management
│   │   ├── vault-item-card.tsx
│   │   ├── vault-item-form.tsx
│   │   ├── vault-add-button.tsx
│   │   ├── stat-card.tsx
│   │   ├── login-streak-tracker.tsx
│   │   ├── life-progress-button.tsx
│   │   └── sign-out-button.tsx
│   └── lib/
│       ├── actions.ts          ← ALL server actions (todos, habits, projects, vault, XP)
│       ├── auth.ts             ← NextAuth config (validates AUTH_SECRET + NEXTAUTH_URL)
│       ├── prisma.ts           ← Prisma client with early DATABASE_URL validation
│       ├── gamification.ts     ← XP_REWARDS constants, getLevelForXP()
│       └── utils.ts            ← cn() helper
├── .env                        ← NOT in git — must create on each machine
├── .env.example                ← Template (committed)
├── .gitignore
├── package.json
├── tailwind.config.ts          ← (Tailwind 4 uses CSS-based config, not JS)
└── next.config.ts
```

---

## Environment Setup (Every New Machine)

1. Copy `.env.example` → `.env`
2. Set these values:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   AUTH_SECRET="any-long-random-string-32-chars-min"
   NEXTAUTH_URL="http://localhost:3002"
   ```
3. Run:
   ```bash
   npm install
   npm run db:push    # creates prisma/dev.db with full schema
   npm run seed       # creates demo user
   npm run dev        # starts on http://localhost:3002
   ```
4. Login: `avadh@pdbclad.app` / `password123`

---

## Database Schema (Key Models)

```
User           { id, email, passwordHash, name, xp, level }
Todo           { id, userId, title, priority, tags, dueDate, isLifetime, progress, progressMax, completedAt }
Project        { id, userId, title, description, status, progressPct, color }
Milestone      { id, projectId, title, order, completedAt }
Habit          { id, userId, title, type(good|bad), icon, unit(null=boolean), targetValue }
HabitLog       { id, habitId, date, completed, value }   ← unique(habitId, date)
ActivityLog    { id, userId, content, category, source, xpEarned, createdAt }
Badge          { id, userId, badgeType, unlockedAt }
Streak         { id, userId, type, currentCount, bestCount, lastDate }
VaultItem      { id, userId, category, title, data(JSON), tags, notes }
VaultReminder  { id, vaultItemId, remindAt, repeat, isActive }
ApiKey         { id, userId, keyHash, label }
```

Key conventions:
- **Habits**: `unit = null` means boolean (toggle). `unit = "cups"` etc means quantity-based with `+1`, `-1`, and custom value input.
- **Projects**: `progressPct` is auto-calculated from completed milestones by `recalcProjectProgress()` in actions.ts
- **Streaks**: type is `"login"` or `"habit_{habitId}"` — keyed by `[userId, type]` unique constraint
- **VaultItem.data**: stored as JSON string — structure varies by category (subscription, insurance, vehicle, etc.)
- **HabitLog**: unique per (habitId, date) — upsert used in `toggleHabitLog` and `logHabitValue`

---

## XP / Gamification System

Defined in `src/lib/gamification.ts`:

```
XP_REWARDS = {
  COMPLETE_TODO: 10,
  COMPLETE_HABIT_GOOD: 15,
  LOG_BAD_HABIT: 2,       // honesty bonus
  LOG_ACTIVITY: 3,
  COMPLETE_MILESTONE: 50,
  DAILY_LOGIN: 5,         // × streak days, capped at 50
}
```

Level thresholds are in a `LEVELS` array. `getLevelForXP(xp)` returns the current level number. Level-up is detected in `addXP()` which auto-updates `user.level`.

---

## Key Server Actions (`src/lib/actions.ts`)

All actions are async, use `"use server"`, check auth via `getUser()`, and call `revalidatePath()` after mutations.

### Todos
- `createTodo(formData)` — creates todo, awards 0 XP (XP on completion)
- `toggleTodo(todoId)` — toggle complete/incomplete, awards 10 XP on completion
- `deleteTodo(todoId)`
- `updateTodoProgress(todoId, progress)` — for lifetime goals with progress tracking

### Projects
- `createProject({ title, description?, color? })` — creates project
- `updateProject(projectId, { title?, description?, status?, color? })` — edit project
- `deleteProject(projectId)` — cascades to milestones
- `createMilestone(projectId, title)` — adds milestone
- `toggleMilestone(milestoneId)` — toggle complete, awards 50 XP, auto-recalcs project %
- `deleteMilestone(milestoneId)` — auto-recalcs project %
- `recalcProjectProgress(projectId)` — internal helper: counts completed/total milestones, sets progressPct, auto-sets status="completed" when all done

### Habits
- `toggleHabitLog(habitId)` — boolean habits: toggle on/off for today, awards 15 XP or 2 XP
- `logHabitValue(habitId, delta)` — quantity habits: increment/decrement value for today (delta can be negative), upserts HabitLog
- `deleteHabit(habitId)` — removes habit + all logs

### Vault
- `createVaultItem(formData)` — creates vault item with JSON data
- `updateVaultItem(id, formData)` — edit vault item
- `deleteVaultItem(id)`

### Misc
- `quickLog(formData)` — logs activity entry, awards 3 XP, parses #tags

---

## UI / Design System

**Theme**: Light theme (white/light grey). Uses CSS custom properties in `globals.css`:

```css
--color-bg-primary: #ffffff
--color-bg-secondary: #f8f9fa
--color-bg-card: #ffffff
--color-bg-card-hover: #f8f9fa
--color-text-primary: #1a1a1a
--color-text-secondary: #666666
--color-text-muted: #999999
--color-border: #e5e7eb
--color-xp-bar: #0066cc          ← blue (replaces old accent-purple)
--color-accent-purple: #0066cc   ← remapped to same blue
--color-accent-green: #16a34a
--color-accent-red: #dc2626
--color-accent-orange: #ea580c
--color-accent-yellow: #ca8a04
```

**Key CSS classes**:
- `.glass` — card with border + subtle shadow (no blur/backdrop on light theme)
- `.xp-bar-fill` — animated blue progress bar
- Habit dots: `bg-accent-green` (good logged), `bg-accent-red` (bad logged), `bg-border` (missed)

---

## What's Working (Current State as of March 2026)

- ✅ Auth (login/logout, session, JWT)
- ✅ Dashboard homepage with today's tasks, habits, projects, activity feed, weekly stats
- ✅ Todos (create, complete, delete, lifetime goals with progress)
- ✅ Habits (good/bad, boolean + quantity-based, 7-day history dots, streaks display)
- ✅ Projects (create, edit, delete, milestones with toggle + delete, auto % progress)
- ✅ Life Vault (CRUD for subscriptions, insurance, vehicle, finance, health, document, other)
- ✅ Activity log page
- ✅ Stats page
- ✅ XP system (all actions award XP)
- ✅ Level calculation
- ✅ Gamification: XP_REWARDS, getLevelForXP
- ✅ Command bar (quick log via natural language, bottom of page)
- ✅ Error boundaries (global + dashboard-level)
- ✅ Login streak tracker (tracks daily login streaks)

---

## What's NOT Done Yet (Next Phases)

These are planned in the project plan but not yet built:

### High Priority (Phase 5 — Gamification & Polish)
- [ ] **Badge system** — unlock logic + display (badge types: 7-Day Warrior, Century, Project Closer, etc.)
- [ ] **Daily quests** — auto-generated daily goals (complete 5 todos, log 3 habits, etc.)
- [ ] **Level-up celebration modal** — full-screen confetti overlay when level changes
- [ ] **Streak notifications** — "Don't break your streak!" reminder at 9pm if not logged today
- [ ] **Habit heatmap** — GitHub-style yearly heatmap per habit

### Medium Priority
- [ ] **Full-text search** — universal search across todos, vault, logs, projects
- [ ] **Smart reminders** — dashboard "Attention Needed" section from VaultReminder dates
- [ ] **Subscription spend analytics** — monthly/yearly totals + breakdown by category
- [ ] **Weekly review flow** — weekly summary + XP reward
- [ ] **PWA** — installable on phone, service worker, offline support

### Lower Priority (Phase 6)
- [ ] **API Gateway** — `POST /api/v1/log` with API key auth for Telegram/Shortcuts
- [ ] **Telegram bot integration**

---

## Common Gotchas

1. **`prisma/dev.db` is not in git** — always run `npm run db:push && npm run seed` on fresh clone
2. **Port is hardcoded to 3002** — both in `package.json` and `.env` `NEXTAUTH_URL`
3. **Tailwind v4** uses CSS-based config (`@theme {}` in globals.css), NOT `tailwind.config.js` theme object
4. **NextAuth v5** uses `auth()` (not `getServerSession()`), and `handlers` exported from `src/lib/auth.ts`
5. **`prisma/prisma/`** — there's an accidental nested prisma folder (from a stray generate command); it's in `.gitignore` and can be ignored
6. **On Windows**: use `powershell.exe -Command "Stop-Process -Id <PID> -Force"` to kill stuck Node processes, NOT `kill`
7. **Habit streaks** are stored in the `Streak` table with type `"habit_{habitId}"`. Currently displayed but streak increment logic needs to be called consistently when habits are toggled — verify this works correctly before adding badge logic

---

## Avadh's Preferences (Important for UX Work)

- No unnecessary confirmations / "are you sure?" prompts for small actions
- Light theme — the old dark purple gradient theme was replaced and should NOT come back
- Mark required fields visually in forms (asterisk or similar)
- Quantity habits should feel incremental, not all-or-nothing — the +1 / -1 / custom `#` pattern is correct
- Homepage should not be cluttered — keep it focused on today's priorities
- Delete buttons: hidden by default, show on hover (`group-hover:block`) — avoids accidental deletions
- Mobile-first thinking: bottom command bar, one-handed usability

---

## Git / GitHub

- Repo: **https://github.com/bachatgenie/pdbclad**
- Branch: `master`
- Account: `bachatgenie`
- To push: `git add -A && git commit -m "..." && git push`

---

## Dev Server

Start with:
```bash
npm run dev
```

Runs on **http://localhost:3002**

If port is occupied (Windows):
```powershell
netstat -ano | findstr :3002
powershell -Command "Stop-Process -Id <PID> -Force"
```
