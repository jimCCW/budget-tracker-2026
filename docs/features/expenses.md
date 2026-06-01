# Expenses

> Records money spent by the user — linked to an account and category. The account balance is decremented atomically on each create.

**Status:** Partial (backend + modal complete; standalone list page not yet built)
**Route:** `/expenses` (placeholder — returns null)
**Last updated:** 2026-06-01

---

## Overview

Expense records represent money the user spends. Each record is linked to an account (whose balance is decremented) and an EXPENSE-type category. The service supports optional filtering by year and/or month, and all balance changes are atomic — a failed expense create never leaves the account in a partial state.

Expenses are currently created and edited through `AddTransactionModal`. The `/expenses` page is a placeholder pending a dedicated list view.

---

## User Flows

- **Create expense:** Via `AddTransactionModal` (Expense tab) → `POST /api/expenses` → account balance decremented.
- **Recurring expense:** Via `AddTransactionModal` with "Repeat" checked → creates a `RecurringRule`; the engine materialises expense records automatically.
- **Edit expense:** `PATCH /api/expenses/:id` → balance delta reconciled atomically (handles account switches and amount changes).
- **Delete expense:** `DELETE /api/expenses/:id` → account balance incremented (reversal).

---

## Frontend

**Route / Page**

| File                              | Role                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `app/(private)/expenses/page.tsx` | Placeholder — returns `null`; list view not yet built |

Expenses are entered via `AddTransactionModal` — see [Transactions](transactions.md).

**Forms**

| Schema file                                  | Fields                                                      | Key validation                                               |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `features/expenses/schemas/expenseSchema.ts` | `accountId`, `categoryId`, `amount`, `date`, `description?` | All except `description` required; description max 255 chars |

**Hooks**

| Hook               | Endpoint             | Invalidates on success         |
| ------------------ | -------------------- | ------------------------------ |
| `useCreateExpense` | `POST /api/expenses` | `['expenses']`, `['accounts']` |

---

## Backend

**Base path:** `/api/expenses`

**Endpoints**

| Method   | Path                | Auth     | Body / Query               | Success response                             |
| -------- | ------------------- | -------- | -------------------------- | -------------------------------------------- |
| `GET`    | `/api/expenses`     | Required | `?year=&month=` (optional) | `{ success: true, data: Expense[] }`         |
| `GET`    | `/api/expenses/:id` | Required | —                          | `{ success: true, data: Expense }`           |
| `POST`   | `/api/expenses`     | Required | `createExpenseSchema`      | `{ success: true, data: Expense }` 201       |
| `PATCH`  | `/api/expenses/:id` | Required | `updateExpenseSchema`      | `{ success: true, data: Expense }`           |
| `DELETE` | `/api/expenses/:id` | Required | —                          | `{ success: true, data: { deleted: true } }` |

**Middleware chain**

```
authMiddleware → validate(schema) → controller
```

**Business rules**

- `userId` is always scoped from `req.user.id` — never trusted from the request body.
- `getAllController` calls `runCatchupThrottled(userId)` before fetching, so recurring expense entries materialise in the same response.
- `GET /api/expenses` supports optional `?year` and `?month` query params. Date filters use UTC boundaries: `Date.UTC(year, month−1, 1)` → `Date.UTC(year, month, 0, 23, 59, 59, 999)`.
- Category ownership: `userId = null` → system default (accessible to all); `userId ≠ null && ≠ requestingUser` → FORBIDDEN. This prevents IDOR — a user cannot use another user's custom category.
- All balance operations are wrapped in `prisma.$transaction`:
  - **Create:** decrement account balance by `amount`.
  - **Delete:** increment account balance by `amount` (reversal).
  - **Update (account changed):** increment old account by original amount, decrement new account by new amount.
  - **Update (same account, amount changed):** decrement account by `(newAmount − oldAmount)`.

**Error cases**

| Code           | HTTP | When                                                 |
| -------------- | ---- | ---------------------------------------------------- |
| `UNAUTHORIZED` | 401  | Missing or invalid JWT                               |
| `NOT_FOUND`    | 404  | Expense record, account, or category does not exist  |
| `FORBIDDEN`    | 403  | Record, account, or category belongs to another user |

---

## Data Model

```prisma
model Expense {
  id              String          @id @default(uuid())
  userId          String
  categoryId      String          // required; EXPENSE-type category
  accountId       String
  amount          Float
  description     String?
  date            DateTime
  isRecurring     Boolean         @default(false)  // legacy field
  recurrence      RecurrenceType?                  // legacy field
  recurringRuleId String?         // set when materialised by the recurrence engine
  createdAt       DateTime        @default(now())

  @@unique([recurringRuleId, date])  // idempotency: prevents duplicate engine runs
  @@index([userId, date])            // optimises date-range queries
}
```

---

## Dependencies

- **Auth** — all endpoints require a valid JWT
- **Accounts** — balance decremented/incremented atomically on every mutation
- **Categories** — must be `CategoryType.EXPENSE`; system defaults (`userId = null`) are accessible to all users
- **Recurring** — expense records may be owned by a `RecurringRule` via `recurringRuleId` (set to null on rule delete)

---

## Notes

- The `/expenses` page currently returns `null` — a dedicated list view with filtering, edit, and delete actions has not been built yet.
- `isRecurring` and `recurrence` are legacy fields from an earlier design. Recurring behaviour is now fully managed via `RecurringRule` + `recurringRuleId`. These fields are not written by any current service code and can be ignored.
