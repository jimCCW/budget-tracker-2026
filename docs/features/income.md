# Income

> Records money received by the user — linked to an account, category, and date. The account balance is incremented atomically on each create.

**Status:** Partial (backend + modal complete; standalone list page not yet built)
**Route:** `/income` (placeholder — returns null)
**Last updated:** 2026-06-01

---

## Overview

Income records represent money the user receives — salary, investment returns, side income, etc. Each record is linked to an account (whose balance is incremented) and an INCOME-type category. `month` and `year` are derived from the UTC date and stored for efficient monthly summary queries.

Income is currently created and edited through `AddTransactionModal`. The `/income` page is a placeholder pending a dedicated list view.

---

## User Flows

- **Create income:** Via `AddTransactionModal` (Income tab) → `POST /api/income` → account balance incremented.
- **Recurring income:** Via `AddTransactionModal` with "Repeat" checked → creates a `RecurringRule`; the engine materialises income records automatically.
- **Edit income:** `PATCH /api/income/:id` → balance delta reconciled atomically (handles account switches).
- **Delete income:** `DELETE /api/income/:id` → account balance decremented (reversal).

---

## Frontend

**Route / Page**

| File                            | Role                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `app/(private)/income/page.tsx` | Placeholder — returns `null`; list view not yet built |

Income is entered via `AddTransactionModal` — see [Transactions](transactions.md).

**Forms**

| Schema file                               | Fields                                               | Key validation                                                          |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `features/income/schemas/incomeSchema.ts` | `accountId`, `categoryId`, `amount`, `date`, `note?` | All except `note` required; `categoryId` min 1 ("Category is required") |

**Hooks**

| Hook              | Endpoint           | Invalidates on success       |
| ----------------- | ------------------ | ---------------------------- |
| `useCreateIncome` | `POST /api/income` | `['income']`, `['accounts']` |

---

## Backend

**Base path:** `/api/income`

**Endpoints**

| Method   | Path              | Auth     | Body / Query               | Success response                             |
| -------- | ----------------- | -------- | -------------------------- | -------------------------------------------- |
| `GET`    | `/api/income`     | Required | `?year=&month=` (optional) | `{ success: true, data: Income[] }`          |
| `GET`    | `/api/income/:id` | Required | —                          | `{ success: true, data: Income }`            |
| `POST`   | `/api/income`     | Required | `createIncomeSchema`       | `{ success: true, data: Income }` 201        |
| `PATCH`  | `/api/income/:id` | Required | `updateIncomeSchema`       | `{ success: true, data: Income }`            |
| `DELETE` | `/api/income/:id` | Required | —                          | `{ success: true, data: { deleted: true } }` |

**Middleware chain**

```
authMiddleware → validate(schema) → controller
```

**Business rules**

- `userId` is always scoped from `req.user.id` — never trusted from the request body.
- `getAllController` calls `runCatchupThrottled(userId)` before fetching, so recurring income entries materialise in the same response.
- `GET /api/income` supports optional `?year` and `?month` query params for monthly summaries; filters use UTC date boundaries.
- `month` and `year` are derived from the ISO date string in UTC (month is 1–12) and stored on every create/update.
- Category ownership: `userId = null` → system default category (accessible to all); `userId ≠ null && ≠ requestingUser` → FORBIDDEN.
- All balance operations are wrapped in `prisma.$transaction`:
  - **Create:** increment account balance by `amount`.
  - **Delete:** decrement account balance by `amount` (reversal).
  - **Update (account changed):** decrement old account by original amount, increment new account by new amount.
  - **Update (same account, amount changed):** increment account by `(newAmount − oldAmount)`.

**Error cases**

| Code           | HTTP | When                                                 |
| -------------- | ---- | ---------------------------------------------------- |
| `UNAUTHORIZED` | 401  | Missing or invalid JWT                               |
| `NOT_FOUND`    | 404  | Income record, account, or category does not exist   |
| `FORBIDDEN`    | 403  | Record, account, or category belongs to another user |

---

## Data Model

```prisma
model Income {
  id              String         @id @default(uuid())
  userId          String
  accountId       String
  categoryId      String         // required; INCOME-type category
  amount          Float
  date            DateTime
  month           Int            // UTC month (1–12), derived from date
  year            Int            // UTC year, derived from date
  note            String?
  recurringRuleId String?        // set when materialised by the recurrence engine
  createdAt       DateTime       @default(now())

  @@unique([recurringRuleId, date])  // idempotency: prevents duplicate engine runs
  @@index([userId, year, month])     // optimises monthly summary queries
}
```

`categoryId` was added as a required field on 2026-06-01. Existing rows were backfilled with the first available INCOME category.

---

## Dependencies

- **Auth** — all endpoints require a valid JWT
- **Accounts** — balance incremented/decremented atomically on every mutation
- **Categories** — must be `CategoryType.INCOME`; system defaults (`userId = null`) are accessible to all users
- **Recurring** — income records may be owned by a `RecurringRule` via `recurringRuleId` (set to null on rule delete)

---

## Notes

- The `/income` page currently returns `null` — a dedicated list view showing income history, filters, and edit/delete actions has not been built yet.
- `categoryId` was not present on the `Income` model at initial implementation. It was added as a required field on 2026-06-01; all existing rows were backfilled with the first INCOME category from the seed.
