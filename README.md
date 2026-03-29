# PDBclad — Personal Dashboard for Life

A gamified second-brain and life operating system. Track todos, habits, projects, life admin (subscriptions, insurance, car service), and everything in between. Log fast, recall instantly, get rewarded for showing up.

---

## Quick Start (Local Dev)

### 1. Clone & install

```bash
git clone https://github.com/bachatgenie/pdbclad.git
cd pdbclad
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="any-random-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3002"
```

> To generate a secure `AUTH_SECRET`: `openssl rand -base64 32`

### 3. Initialize the database

```bash
npm run db:push    # creates schema in dev.db
npm run seed       # creates demo user
```

### 4. Start the server

```bash
npm run dev
```

App runs at **http://localhost:3002**

### 5. Log in

| Field    | Value               |
|----------|---------------------|
| Email    | `avadh@pdbclad.app` |
| Password | `password123`       |

---

## Scripts

| Command               | Purpose                                      |
|-----------------------|----------------------------------------------|
| `npm run dev`         | Dev server on port 3002                      |
| `npm run build`       | Build for production                         |
| `npm start`           | Start production server                      |
| `npm run db:push`     | Push schema to dev.db (no migration file)    |
| `npm run seed`        | Seed demo user                               |
| `npm run db:setup`    | Migrate + seed (development)                 |
| `npm run db:setup:prod` | Migrate + seed (production)                |

---

## Production Deployment

### Environment variables

```env
DATABASE_URL="postgresql://user:password@host:5432/pdbclad"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Deploy steps

```bash
npm run build
npm run db:setup:prod   # runs prisma migrate deploy + seed
npm start
```

Works on **Vercel**, **Railway**, **Render**, or any Node host.

> **SQLite is dev-only.** Use PostgreSQL in production. Schema is compatible — just change `DATABASE_URL`.

---

## Tech Stack

| Layer      | Tech                                          |
|------------|-----------------------------------------------|
| Framework  | Next.js 16 (App Router)                       |
| UI         | React 19, Tailwind CSS 4, Lucide icons        |
| Backend    | Next.js Server Actions                        |
| ORM        | Prisma 6                                      |
| Database   | SQLite (dev) / PostgreSQL (prod)              |
| Auth       | NextAuth v5 (Credentials + JWT sessions)      |
| Passwords  | bcryptjs                                      |

---

## Features

- **Todos** — tasks with priority, tags, due dates, and lifetime bucket-list goals with progress tracking
- **Habits** — boolean or quantity-based habits (good/bad), 7-day dot history, streaks, XP integration
- **Projects** — multi-step projects with milestones, completion %, color tags, status management
- **Life Vault** — second brain: subscriptions, insurance, vehicles, finances, documents — searchable, with reminders
- **Activity Log** — chronological feed of everything logged (manual, auto, API)
- **Stats** — XP chart, streaks, weekly comparisons
- **Gamification** — XP on every action, level-up system, streaks, badges

---

## Environment Variables

| Variable       | Required | Description                                           |
|----------------|----------|-------------------------------------------------------|
| `DATABASE_URL` | Yes      | `file:./prisma/dev.db` or PostgreSQL connection URL   |
| `AUTH_SECRET`  | Yes      | JWT signing secret — min 32 chars                     |
| `NEXTAUTH_URL` | Yes      | Full app URL (must match what browser uses)           |
| `NODE_ENV`     | No       | `development` or `production`                         |

---

## Troubleshooting

**"Cannot find module" or server error on fresh clone**
→ Run `npm run db:push && npm run seed`

**"Invalid email or password" after clone**
→ Database file doesn't exist yet. Run `npm run db:push && npm run seed`

**Port in use**
→ Dev server is hardcoded to 3002. Kill old process: `npx kill-port 3002`

**Windows: kill stuck Next.js process**
```powershell
powershell -Command "Stop-Process -Id <PID> -Force"
```

**Prisma generate fails while server is running**
→ Stop the dev server first, run `npx prisma generate`, then restart

---

## License

ISC
