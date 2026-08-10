# Accounts

> Track balances across separate accounts — bank, cash, investment, crypto, and credit cards — and see net worth broken down by liquidity.

**Status:** Implemented
**Route:** `/accounts`
**Last updated:** 2026-08-10

---

## Overview

Every income and expense entry in the app is recorded against an account, and that account's `balance` is updated atomically as part of the write (see `docs/features/income.md` / `docs/features/expenses.md`). This feature is where those accounts and their running balances are created, edited, and reviewed. It also computes net worth, split into liquid / investment / credit buckets, since a `CREDIT` account's balance behaves differently from the others — it goes negative as spending accrues, so "money owed" has to be derived rather than read directly.

A brand-new user is never accountless: registration creates a default `BANK` account named "Main Account" (see `accountService.createDefault`, called from `authService.register`) so there's always somewhere for their first transaction to land.

---

## User Flows

- **View summary:** Land on `/accounts` → four stat tiles (Net Worth, Liquid, Investments, Credit) plus a card per account showing its balance, type, and color.
- **Create an account:** "Add Account" or an empty-state / grid "add" button opens `AccountFormModal` → pick a type (grouped as liquid / investment / credit in the UI), name it, set an initial balance and color → live preview pane updates as you type.
- **Edit an account:** Card's overflow menu → "Edit" → same modal, pre-filled, balance is directly editable (not just via transactions).
- **Delete an account:** Card's overflow menu → "Delete" → confirmation modal. Blocked with a `409` if it's the user's last remaining account — there must always be somewhere for transactions to go.

---

## Frontend

**Route / Page**

| File                                            | Role                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `app/(private)/accounts/page.tsx`               | Route entry point — re-exports `AccountsPage`                        |
| `features/accounts/components/AccountsPage.tsx` | Main page: net worth header, account grid, create/edit/delete modals |

**Components**

| Component            | Responsibility                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NetWorthHeader`     | Four `StatCard`s: net worth, liquid, investments, credit owed                                               |
| `AccountCard`        | One account's icon/color, name, type label, balance (red if `CREDIT`), and an overflow `Menu` (Edit/Delete) |
| `AccountFormModal`   | Create/edit form — type grid, name, balance, color picker, with a live preview pane                         |
| `DeleteAccountModal` | Confirmation before a destructive delete                                                                    |

**Hooks**

| Hook                | Query key / Mutation      | What it does                                                                                                                        |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `useAccountSummary` | `['accounts', 'summary']` | Fetches `netWorth`/`liquidAmount`/`investmentAmount`/`creditAmount` + the account list in one call — the page's primary data source |
| `useAccounts`       | `['accounts']`            | Fetches the plain account list (used elsewhere, e.g. account pickers in other features)                                             |
| `useCreateAccount`  | mutation                  | `POST /api/accounts`, invalidates `['accounts']` on success                                                                         |
| `useUpdateAccount`  | mutation                  | `PATCH /api/accounts/:id`, invalidates `['accounts']`                                                                               |
| `useDeleteAccount`  | mutation                  | `DELETE /api/accounts/:id`, invalidates `['accounts']`                                                                              |

Note `useAccountSummary` and `useAccounts` both key off `'accounts'` but at different cache paths (`['accounts', 'summary']` vs `['accounts']`) — the mutations invalidate the shorter key, which also invalidates the summary since TanStack Query treats `['accounts']` as a prefix match.

**Forms**

| Schema file                | Fields                                       | Key validation rules                                                                                                                                          |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schemas/accountSchema.ts` | `name`, `type`, `balance`, `icon?`, `color?` | `name`: 1–60 chars; `type`: one of `BANK`/`INVESTMENT`/`CRYPTO`/`CASH`/`CREDIT`; `balance`: must be a number (no min — a `CREDIT` account can start negative) |

`features/accounts/constants.ts` holds `ACCOUNT_TYPE_META` (per-type label/icon/color/group), the fixed `ACCOUNT_COLORS` swatch list, and `DEFAULT_ACCOUNT_COLOR` — shared by the card and the form's preview pane so both render a type identically.

---

## Backend

**Base path:** `/api/accounts`

**Endpoints**

| Method   | Path       | Auth     | Body / Query                                | Success response                                                                                           |
| -------- | ---------- | -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET`    | `/summary` | Required | —                                           | `{ success: true, data: { netWorth, liquidAmount, investmentAmount, creditAmount, accounts: Account[] } }` |
| `GET`    | `/`        | Required | —                                           | `{ success: true, data: Account[] }`                                                                       |
| `POST`   | `/`        | Required | `{ name, type?, balance?, icon?, color? }`  | `{ success: true, data: Account }` 201                                                                     |
| `PATCH`  | `/:id`     | Required | `{ name?, type?, balance?, icon?, color? }` | `{ success: true, data: Account }`                                                                         |
| `DELETE` | `/:id`     | Required | —                                           | `{ success: true, data: { deleted: true } }`                                                               |

**Middleware chain**

```
authMiddleware → validate(schema) → controller → service
```

**Business rules**

- `userId` is always taken from `req.user.id`, never from the request body.
- Ownership check on update/delete: `findUnique({ where: { id } })` then compare `account.userId !== userId` → `403 FORBIDDEN` (not 404, so an existing account under someone else's ID doesn't look like it doesn't exist — but also doesn't confirm anything about who owns it beyond "not you").
- A user can never delete their last account — blocked with `409 CONFLICT`. This guarantees every income/expense write always has a valid account to target.
- `creditDebt = Σ max(-balance, 0)` across `CREDIT`-type accounts — always ≥ 0 regardless of how positive or negative individual credit balances are.
- `liquidAmount = (BANK + CASH balances) − creditDebt` and `netWorth = (BANK + CASH + INVESTMENT + CRYPTO balances) − creditDebt` — both net out credit debt against the rest of the portfolio, matching how a real net-worth figure should read.
- New accounts default to `type: 'BANK'` and `balance: 0` when not specified.

**Error cases**

| Code               | HTTP | When                                                                           |
| ------------------ | ---- | ------------------------------------------------------------------------------ |
| `VALIDATION_ERROR` | 400  | `name` missing/too long, `balance` not a number, `type` not a valid enum value |
| `UNAUTHORIZED`     | 401  | Missing or invalid JWT                                                         |
| `FORBIDDEN`        | 403  | Account belongs to another user                                                |
| `NOT_FOUND`        | 404  | Account ID doesn't exist                                                       |
| `CONFLICT`         | 409  | Attempting to delete the user's only account                                   |

---

## Data Model

```prisma
enum AccountType {
  BANK
  INVESTMENT
  CRYPTO
  CASH
  CREDIT // balance goes negative as spending is recorded
}

model Account {
  id      String      @id @default(uuid())
  userId  String
  name    String
  type    AccountType @default(BANK)
  balance Float       @default(0)
  icon    String?
  color   String?
  incomes        Income[]
  expenses       Expense[]
  recurringRules RecurringRule[]
}
```

`balance` is a running total, not computed on read — income/expense writes update it atomically as part of the same operation that creates the transaction row, rather than being derived by summing history each time.

---

## Dependencies

- **Auth** — all endpoints require a valid JWT; `userId` is scoped from `req.user.id`. Registration also depends on this feature: `authService.register` calls `accountService.createDefault` to give a new user a starting account.
- **Income / Expenses** — every income and expense entry references an `accountId` and updates that account's `balance` as a side effect of the write.
- **Recurring** — `RecurringRule` also targets an `accountId`; generated income/expense rows update the same account balance the rule specifies.
- **Dashboard** — the dashboard's stat tiles and `creditDebt` figure are built on the same aggregation logic as `accountService.getSummary`.

---

## Notes

- `useAccounts` (plain list) exists alongside `useAccountSummary` (list + aggregates) because other features — e.g. an account picker in the transaction modal — only need the list, not the net-worth math.
- The account form lets a user directly edit `balance` on an existing account, not just via transactions. That's an intentional escape hatch (e.g. correcting a starting balance) but means an account's balance history isn't fully reconstructable from income/expense rows alone if it's ever been hand-edited.
- `icon` is accepted by both API schemas but the frontend never sends one — `AccountCard`/`AccountFormModal` derive the icon from `type` via `ACCOUNT_TYPE_META`, falling back to a per-account `color` if set. The field exists for forward compatibility (e.g. custom icons) but is currently always `null` in practice.
