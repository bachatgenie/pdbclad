# PDBclad — Original Proposed Plan

## Screens (9 wireframes)
- Dashboard Home (desktop + mobile) — daily snapshot with XP bar, streaks, quests, tasks, habits
- Command Bar — killer feature: type anything, log in 2 seconds
- Todo / Life List — daily todos + lifetime bucket list with progress tracking
- Projects — milestone-based tracking with progress bars
- Habit Tracker — weekly grid + GitHub-style yearly heatmap, good habits earn XP, bad habits cost XP
- Activity Log — chronological feed from all sources (manual, Telegram, API)
- Stats / Gamification — levels, badges, streaks, week-over-week comparisons
- Level-Up Celebration — full-screen confetti modal (the dopamine hit)

## Tech Stack
Next.js + Tailwind + PostgreSQL + Prisma + NextAuth, deployed as PWA on Vercel. No app store needed.

## Gamification System
- XP for every action
- Levels with titles (Beginner → Legend)
- Daily quests
- Streak multipliers
- Mystery badges
- Loss aversion notifications

## External API
Simple POST /api/v1/log with API key auth — works with Telegram bots, iOS Shortcuts, Zapier.

## 12-Week Plan — 6 Phases

### Phase 1 — Foundation (DONE ✅)
- Auth: login, logout, JWT sessions, beta signup with invite code gate
- Dashboard homepage
- Basic layout, sidebar, XP bar

### Phase 2 — Core Features (DONE ✅)
- Todos: CRUD, priorities, due dates, lifetime goals with progress
- Habits: boolean + quantity-based, 7-day dot history, streaks, good/bad types
- Projects: CRUD, milestones with toggle + auto % progress, color picker
- Activity log page

### Phase 3 — Life Vault + Stats (DONE ✅)
- Life Vault: full CRUD, 8 category types, reminders
- Stats page
- XP system, levels, login streaks, command bar

### Phase 4 — PARA / Areas + Project Detail (IN PROGRESS 🔄)
- Areas (PARA) — group projects by life area ✅ DONE locally, needs production migration
- Connect Areas to Projects (assign project to area, group by area on projects page)
- Project detail page: /projects/[id]
- Success definition field ("What does 100% look like?")
- First step field
- Planning panel: this month / this week / today / right now
- Milestones + subtasks
- AI export/import for project planning

### Phase 5 — Gamification Polish (NOT STARTED ❌)
- Badge unlock logic — check conditions after XP events
- Badge display UI — profile/stats page showing earned badges
- Level-up celebration — full-screen confetti modal when level increases
- Daily quests — auto-generated each day
- Habit heatmap — GitHub-style yearly grid per habit

### Phase 6 — UX & Integrations (NOT STARTED ❌)
- Universal search
- Weekly review flow
- Subscription spend analytics
- PWA — installable on phone
- Onboarding flow
- Telegram bot
- API gateway expansion

## Current Status (as of this session)
- Production URL: https://dashboard.vibedash.uk
- GitHub: https://github.com/bachatgenie/pdbclad
- Local dev: SQLite via prisma/schema.dev.prisma, server at http://localhost:3002
- Playwright tests: 6/6 passing (smoke + areas CRUD)
- Areas feature: built + tested locally, needs Neon production migration to go live
- Next up: connect Areas to Projects, then project detail page features
