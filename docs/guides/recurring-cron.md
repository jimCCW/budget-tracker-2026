# Migrating Recurring Transactions to a Server-Side Cron

**Last updated:** 2026-06-01

---

## Current approach: lazy catch-up

The current implementation materialises recurring transactions lazily — the engine only runs when the user makes a request. Specifically:

- `POST /api/recurring/catchup` is called by the frontend on login and every 30 minutes via `useScheduledCatchup` in `AppShell`.
- `runCatchupThrottled` is called at the top of `GET /api/income` and `GET /api/expenses` as a secondary fallback (throttled to 60 s per user).

**Limitation:** If the user is offline, transactions are never materialised for that period. A midnight rollover only runs after the user's next request.

---

## Why migrate to a cron?

A server-side cron runs independently of user activity:

- Transactions materialise on schedule even when no user is logged in.
- Easier to audit: you can log every cron run and see exactly when each rule fired.
- Scales to multi-user without depending on each user's session.

---

## The engine is already ready

`materializeDueTransactions(userId)` in `backend/src/services/recurrenceEngine.ts` is fully engine-agnostic:

- It is idempotent — calling it multiple times never creates duplicate records (`@@unique([recurringRuleId, date])` on both `Income` and `Expense`).
- It handles its own error recovery per rule — one failing rule does not block others.
- It returns `{ created: number }` so callers can log or report results.

No changes to the engine are needed for either migration option.

---

## Option A — `node-cron` (recommended)

Runs inside the existing Express process. Zero extra infrastructure.

### Setup

```bash
cd backend
pnpm add node-cron
pnpm add -D @types/node-cron
```

### Create the job — `backend/src/jobs/recurringJob.ts`

```ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { materializeDueTransactions } from '../services/recurrenceEngine';

const prisma = new PrismaClient();

// Runs every hour at :00 — adjust schedule as needed
cron.schedule('0 * * * *', async () => {
  console.log('[recurringJob] catch-up started');
  const users = await prisma.user.findMany({
    where: { recurringRules: { some: { isActive: true } } },
    select: { id: true },
  });
  for (const { id } of users) {
    const result = await materializeDueTransactions(id).catch((err) => {
      console.error(`[recurringJob] failed for user ${id}:`, err);
      return { created: 0 };
    });
    if (result.created > 0) {
      console.log(
        `[recurringJob] user ${id}: ${result.created} transaction(s) created`
      );
    }
  }
  console.log('[recurringJob] catch-up complete');
});
```

### Register in `backend/src/index.ts`

```ts
import './jobs/recurringJob';
```

Add this import near the top of `index.ts`, after the Express app setup.

### Tradeoffs

| Pro                           | Con                                                                        |
| ----------------------------- | -------------------------------------------------------------------------- |
| Zero extra infrastructure     | Runs in the same process — a server restart mid-run loses in-progress jobs |
| Simple to add and remove      | Not visible in a job dashboard                                             |
| Cron schedule is configurable | Node process must stay alive for schedule to fire                          |

This is the right choice for a personal or small-team app.

---

## Option B — BullMQ + Redis (queue-based)

Suitable when you need retry guarantees, job history, or true multi-process distribution.

### Setup

```bash
cd backend
pnpm add bullmq ioredis
```

Add Redis to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
```

Add `REDIS_URL=redis://localhost:6379` to `backend/.env`.

### Architecture

```
Scheduler process              Worker process
────────────────               ──────────────────────────
Every hour:                    For each job in queue:
  query active users     →       materializeDueTransactions(userId)
  enqueue one job/user           log result
  to 'recurring-catchup'
```

Both scheduler and worker import `materializeDueTransactions` — no engine changes needed.

### Tradeoffs

| Pro                                  | Con                                     |
| ------------------------------------ | --------------------------------------- |
| Jobs survive process restarts        | Requires Redis in docker-compose        |
| Retry on failure                     | More moving parts to operate            |
| Job dashboard available (Bull Board) | Overkill for a single-user personal app |

---

## Recommended migration path

1. **Add `node-cron` job** (Option A) in `backend/src/jobs/recurringJob.ts` and register it in `index.ts`.
2. **Remove `runCatchupThrottled`** calls from `incomeController.getAllController` and `expenseController.getAllController` — these are no longer needed once the server runs catch-up proactively.
3. **Keep `POST /api/recurring/catchup`** endpoint — it powers the manual "Run now" button in `RecurringPage` and is useful for testing.
4. **Remove `useScheduledCatchup`** from `AppShell` — frontend polling is no longer needed. Keep `useRunCatchup` for the manual button.
5. **If scale demands it**, swap `node-cron` for BullMQ (Option B) without touching `materializeDueTransactions`.

---

## What does not change

| Thing                                  | Why it stays the same                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| `materializeDueTransactions`           | Already idempotent and engine-agnostic                       |
| `@@unique([recurringRuleId, date])`    | Prevents double-materialisation regardless of trigger source |
| `POST /api/recurring/catchup` endpoint | Remains for manual triggers from `RecurringPage`             |
| Frontend `useRunCatchup` hook          | Powers the "Run now" button — keep it                        |
