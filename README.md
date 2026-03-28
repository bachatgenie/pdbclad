# PDBclad - Personal Dashboard for Life

A gamified personal dashboard for tracking todos, habits, projects, and more.

## Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ (for production)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pdbclad
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `DATABASE_URL` - for SQLite: `file:./prisma/dev.db`
   - `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - `http://localhost:3000`
   - `NODE_ENV` - `development`

4. **Initialize the database:**
   ```bash
   npm run db:setup
   ```

   This runs:
   - Prisma migrations
   - Seed script (creates demo user)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at: `http://localhost:3001`

6. **Demo credentials:**
   - Email: `avadh@pdbclad.app`
   - Password: `password123`

---

## Production Deployment

### Database Setup (PostgreSQL)

1. **Create a PostgreSQL database:**
   ```bash
   createdb pdbclad
   ```

2. **Set environment variables:**
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/pdbclad"
   AUTH_SECRET="<generate-new-secret>"
   NEXTAUTH_URL="https://yourdomain.com"
   NODE_ENV="production"
   ```

   Generate AUTH_SECRET with: `openssl rand -base64 32`

3. **Generate a strong AUTH_SECRET - this is critical:**
   ```bash
   openssl rand -base64 32
   ```
   Use the output as your `AUTH_SECRET` environment variable.

4. **Run the build:**
   ```bash
   npm run build
   ```

5. **Set up the database:**
   ```bash
   npm run db:setup:prod
   ```

   This applies all migrations and seeds the database.

6. **Start the server:**
   ```bash
   npm run start
   ```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server on port 3001 |
| `npm run build` | Build the Next.js app |
| `npm start` | Start production server |
| `npm run db:setup` | Run migrations + seed (development) |
| `npm run db:setup:prod` | Run migrations + seed (production) |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema changes (dev only) |
| `npm run seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:validate` | Validate database schema |

---

## Environment Variables

### Required

- **DATABASE_URL** - Database connection string
  - SQLite: `file:./prisma/dev.db`
  - PostgreSQL: `postgresql://user:password@host:5432/pdbclad`

- **AUTH_SECRET** - JWT secret for NextAuth (generate with `openssl rand -base64 32`)

- **NEXTAUTH_URL** - Your app's URL
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

### Optional

- **NODE_ENV** - `development` or `production` (default: `development`)

---

## Architecture

### Tech Stack
- **Frontend**: React 19, Next.js 16, Tailwind CSS 4
- **Backend**: Next.js App Router, Server Actions
- **Database**: Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **Auth**: NextAuth v5 (Credentials provider)
- **Styling**: Tailwind CSS with CSS variables

### Key Features
- Gamification system (XP, levels, streaks, badges)
- Todo management with lifetime goals
- Habit tracking with quantity logging
- Personal vault for important information
- Activity logging and statistics
- User authentication

### Database Models
- `User` - User profiles and stats
- `Todo` - Tasks and lifetime goals
- `Habit` - Habit definitions
- `HabitLog` - Individual habit logs
- `Project` - Projects with milestones
- `Milestone` - Project subtasks
- `ActivityLog` - User activity history
- `Badge` - Achievements
- `Streak` - Streak tracking
- `VaultItem` - Personal vault items
- `VaultReminder` - Vault item reminders
- `ApiKey` - API keys for external integrations

---

## Troubleshooting

### Database connection errors
- Ensure `DATABASE_URL` is correct
- For PostgreSQL, verify the database exists and user has access
- Check that the connection string format matches your database

### "Database file not found" on fresh clone
- Run `npm run db:setup` to initialize the database

### Auth errors
- Ensure `AUTH_SECRET` is set and is a strong value
- Ensure `NEXTAUTH_URL` matches your deployment URL

### Port already in use
- Development server uses port 3001 by default
- Production uses the PORT environment variable (default 3000)

---

## Development

### Adding a new database model
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration-name>`
3. Update seed.ts if needed
4. Run `npm run seed` to test

### Server actions
All server-side actions are in `src/lib/actions.ts`. They handle:
- Database queries and mutations
- Authentication checks
- XP and gamification logic
- Cache revalidation

### Testing authentication
Use the demo credentials after seeding:
- Email: `avadh@pdbclad.app`
- Password: `password123`

---

## License

ISC
