# PDBclad — Project Rules & Agent Execution Guardrails

## 1. Absolute Isolation (Zero-Production Rule)

- NEVER execute migrations, test schema builds, or push adjustments directly onto the live Vercel environment or the production Neon database.
- All building, debugging, and testing must be confined strictly to the local workspace.
- **Local dev uses SQLite** — not Neon. Neon is production-only. This eliminates port-blocking issues entirely. The Prisma schema switches provider to `sqlite` for local development via a `.env.local` override.
- Enforce `NODE_ENV="development"` explicitly across all local terminal sessions so full Next.js stack traces surface instead of hidden production stalls.

## 2. Mandatory Verification Pipeline

Before declaring any feature or structural milestone complete, sequentially execute this pipeline locally:

```bash
# Step 0: Confirm local DB is configured and reachable
npx prisma db pull   # or a simple prisma validate / connection check

# Step 1: Execute local database schema migration
npm run db:migrate

# Step 2: Spin up the local development server
npm run dev
```

If any step fails, intercept the terminal error, evaluate the trace, implement the fix inside the local directory, and re-run from Step 0.

Do not proceed to the next step until the current step passes cleanly.

## 3. Autonomous Visual & Interaction Testing (Prerequisite First)

**Before any feature work begins, Playwright must be installed and a baseline smoke test must pass.** The rule is not enforceable until this prerequisite is confirmed complete.

### Prerequisite setup (one-time)
- Install Playwright
- Write one baseline smoke test: load `http://localhost:3002`, log in, confirm dashboard renders
- Confirm it runs green with `npx playwright test`

### Ongoing rule (once prerequisite passes)
Do not ask the user whether button interactions or page navigation are working. Use Playwright to confirm the targeted system state autonomously.

**Target State Verification Checklist:**
- **Render Test:** Navigate to the modified feature page at `http://localhost:3002`
- **Interaction Simulation:** Simulate real user actions — locate buttons, fill form fields, click save
- **Infinite Loop Audit:** Capture a screenshot at `tests/visual/output/current_render.png` and check explicitly:
  - Is any button stuck in a spinning/loading state?
  - Is UI data failing to persist after a save action?
- If a visual failure or unresolved state is captured, self-correct the source files locally and repeat the audit loop

## 4. Feature Branch Isolation

All new feature work must happen on a named branch, never directly on `master`.

```bash
git checkout -b feature/feature-name
```

`master` only receives a merge after the Rule 2 pipeline passes locally and Playwright tests confirm the feature works. Every broken experiment stays off production.

## 5. Context & Budget Constraints

- Keep implementations compact and precise to maintain token health across extended tasks.
- If complex adjustments approach memory limits, run `/compact` autonomously to compress old activity into brief summaries without purging relevant rule files.
- Periodically run `/cost` to check execution efficiency and prevent runaway loops.
