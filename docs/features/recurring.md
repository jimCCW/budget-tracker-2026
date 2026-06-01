# Recurring Transactions

> Let users define scheduled income or expense rules that automatically materialise transactions on a set frequency (daily, weekly, monthly, yearly).

**Status:** Implemented
**Route:** `/recurring`
**Last updated:** 2026-06-01

---

## Overview

Recurring rules remove the need to manually enter predictable transactions (e.g. monthly salary, weekly groceries). The user creates a rule once; the system creates the actual income or expense records lazily — on the next request after the scheduled date — adjusting account balances atomically each time.

The engine is idempotent: calling it multiple times never creates duplicate records thanks to a database unique constraint on `(recurringRuleId, date)`.

---

## User Flows

- **Create rule:** User fills the `RecurringRuleModal` form and saves → if `startDate ≤ today`, the first occurrence materialises immediately; otherwise it waits until the next scheduled date.
- **Auto-materialise:** On login and every 30 minutes, the frontend calls `POST /api/recurring/catchup`; the engine catches up all overdue occurrences for the user.
- **Manual trigger:** "Run now" button on the Recurring page forces an immediate catch-up.
- **Pause / Resume:** Toggle `isActive` on a rule; paused rules are skipped by the engine.
- **Edit rule:** Update non-structural fields (amount, note, account, category, end date, frequency). The next occurrence uses the updated values.
- **Delete rule:** Removes the rule; all historically materialised income/expense records are kept with `recurringRuleId = null`.

---

## Frontend

**Route / Page**

| File                                                   | Role                                           |
| ------------------------------------------------------ | ---------------------------------------------- |
| `app/(private)/recurring/page.tsx`                     | Route entry point (re-exports `RecurringPage`) |
| `features/recurring/components/RecurringPage.tsx`      | Main page — rule list, "Run now", "New rule"   |
| `features/recurring/components/RecurringRuleModal.tsx` | Create / edit rule form modal                  |

**Components**

| Component            | Responsibility                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `RecurringPage`      | Lists all rules with icon, name, frequency, next-run date, amount; pause/play/edit/delete actions; empty state   |
| `RecurringRuleModal` | Full rule form: kind toggle, amount, frequency pills, category (filtered by kind), account, start/end date, note |

**Hooks**

| Hook                  | Query key       | What it does                                                                                                           |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `useRecurringRules`   | `['recurring']` | Fetches all rules for the user                                                                                         |
| `useCreateRule`       | —               | `POST /api/recurring`; invalidates `['recurring']`, `['income']`, `['expenses']`, `['accounts']`                       |
| `useUpdateRule`       | —               | `PATCH /api/recurring/:id`; invalidates `['recurring']`                                                                |
| `useSetRuleActive`    | —               | `PATCH /api/recurring/:id/active`; invalidates `['recurring']`                                                         |
| `useDeleteRule`       | —               | `DELETE /api/recurring/:id`; invalidates `['recurring']`                                                               |
| `useScheduledCatchup` | `['catchup']`   | `POST /api/recurring/catchup` on mount + every 30 min; on `created > 0` invalidates accounts/income/expenses/recurring |
| `useRunCatchup`       | —               | Manual `POST /api/recurring/catchup`; invalidates all related caches                                                   |

`useScheduledCatchup` is called inside `AppShell` so it fires on every authenticated page load (once per 30-minute stale window, not on every navigation).

**Forms**

| Schema file                                     | Fields                                                                                     | Key validation                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `features/recurring/schemas/recurringSchema.ts` | `kind`, `amount`, `accountId`, `categoryId`, `note?`, `frequency`, `startDate`, `endDate?` | All required except `note` and `endDate`; `categoryId` required for both INCOME and EXPENSE kinds |

**Constants**

`features/recurring/constants/frequencies.ts` exports the canonical `FREQUENCIES` array `{ value, label, icon }` used by all frequency pickers — `RecurringRuleModal`, `RecurringPage` label map, and `AddTransactionModal`. Adding a new frequency only requires editing this one file.

---

## Backend

**Base path:** `/api/recurring`

**Endpoints**

| Method   | Path                        | Auth     | Body / Schema      | Success response                               |
| -------- | --------------------------- | -------- | ------------------ | ---------------------------------------------- |
| `GET`    | `/api/recurring`            | Required | —                  | `{ success: true, data: RecurringRule[] }`     |
| `GET`    | `/api/recurring/:id`        | Required | —                  | `{ success: true, data: RecurringRule }`       |
| `POST`   | `/api/recurring`            | Required | `createRuleSchema` | `{ success: true, data: RecurringRule }` 201   |
| `PATCH`  | `/api/recurring/:id`        | Required | `updateRuleSchema` | `{ success: true, data: RecurringRule }`       |
| `PATCH`  | `/api/recurring/:id/active` | Required | `setActiveSchema`  | `{ success: true, data: RecurringRule }`       |
| `DELETE` | `/api/recurring/:id`        | Required | —                  | `{ success: true, data: { deleted: true } }`   |
| `POST`   | `/api/recurring/catchup`    | Required | —                  | `{ success: true, data: { created: number } }` |

**Middleware chain**

```
authMiddleware → validate(schema) → controller
```

`POST /api/recurring/catchup` skips the validate step (no body).

**Business rules**

- `userId` is always taken from `req.user.id` — never trusted from the request body.
- Account ownership: account must belong to the requesting user.
- Category ownership: `userId = null` means system default (accessible to all); `userId ≠ null && ≠ requestingUser` → FORBIDDEN.
- `anchorDay` is stored as `startDate.getUTCDate()` for MONTHLY rules. Each month the engine restores this day (clamped to the month's last day) to prevent drift (e.g. Jan 31 → Feb 28 → Mar 31, not Mar 28).
- On `create`: if `startDate ≤ now`, `materializeDueTransactions` runs immediately so the first occurrence appears right away.
- On `delete`: historical Income/Expense rows survive via `onDelete: SetNull` on the FK.
- INCOME rules require a `categoryId`; engine warns and skips the rule if it is missing (legacy data guard).

**Recurrence engine (`recurrenceEngine.ts`)**

`materializeDueTransactions(userId, now?)`:

1. Fetches all active rules where `nextRunDate ≤ now`, ordered by `nextRunDate ASC`.
2. For each rule, loops occurrences (max 366 iterations) while `nextRun ≤ now` and within `endDate`.
3. Per occurrence: `prisma.$transaction` creates the Income or Expense record + adjusts account balance atomically, then advances `nextRunDate` via `computeNextRunDate`.
4. P2002 unique constraint violation → occurrence already exists; skip create but still advance `nextRunDate` to avoid getting stuck.
5. Other errors → log and break the rule loop without blocking other rules.
6. Returns `{ created: number }`.

**Catch-up throttle (`catchupService.ts`)**

`runCatchupThrottled(userId)` — in-memory 60 s throttle per user; called at the top of `GET /api/income` and `GET /api/expenses` controllers as a secondary lazy trigger. Never throws.

**Error cases**

| Code           | HTTP | When                                               |
| -------------- | ---- | -------------------------------------------------- |
| `UNAUTHORIZED` | 401  | Missing or invalid JWT                             |
| `NOT_FOUND`    | 404  | Rule, account, or category does not exist          |
| `FORBIDDEN`    | 403  | Rule, account, or category belongs to another user |

---

## Data Model

```prisma
model RecurringRule {
  id          String         @id @default(uuid())
  userId      String
  kind        RecurringKind  // INCOME | EXPENSE
  amount      Float
  accountId   String
  categoryId  String?        // required at create time; nullable for legacy engine guard
  note        String?
  frequency   RecurrenceType // DAILY | WEEKLY | MONTHLY | YEARLY
  interval    Int            @default(1)
  startDate   DateTime
  endDate     DateTime?
  anchorDay   Int?           // day-of-month for MONTHLY drift prevention (1–31)
  nextRunDate DateTime       // date of next scheduled occurrence
  lastRunDate DateTime?      // date of last materialised occurrence
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([userId, isActive, nextRunDate])
}
```

Materialised rows link back via `Income.recurringRuleId` / `Expense.recurringRuleId` with `onDelete: SetNull`. The unique constraint `@@unique([recurringRuleId, date])` on both models provides idempotency.

---

## Dependencies

- **Auth** — all endpoints require a valid JWT; userId is scoped from `req.user.id`
- **Accounts** — account balance is adjusted atomically for each materialised occurrence
- **Categories** — category is required for both kinds; filtered by `CategoryType` in the UI
- **Income / Expenses** — materialised rows are written to these tables with a back-reference to the rule

---

## Notes

- The current implementation uses a **lazy catch-up** pattern rather than a server-side cron — transactions are only materialised when the user makes a request. See [`docs/guides/recurring-cron.md`](../guides/recurring-cron.md) for the migration path to a proper server-side scheduler.
- `dayjs` with the UTC plugin is used for all date arithmetic to avoid timezone drift.
- `interval` defaults to 1 (every period). A future enhancement could expose this in the UI for "every 2 weeks" / "every 3 months" rules.
