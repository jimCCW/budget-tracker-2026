# Dashboard

> The app's home view — an at-a-glance summary of balance, this month's income/expenses/savings, a cashflow trend chart, top spending categories, and the latest transactions.

**Status:** Implemented
**Route:** `/dashboard`
**Last updated:** 2026-07-05

---

## Overview

The dashboard is the landing page after login. It surfaces four headline stat tiles (balance, monthly income, monthly expenses, monthly savings), a cashflow trend chart with selectable time ranges, a spending-by-category donut chart, and a feed of the five most recent transactions. All figures are computed server-side from the user's real Income/Expense/Account/Category data — there is no mock data and no client-side aggregation of raw records.

Two sections that existed in an earlier prototype — a "Budget Progress" bar list and a "Savings Goals" tracker — were deliberately removed. Neither `Budget` nor `Goal` has a Prisma model, so there was no real data to back them; they may return as a separate feature once that data model exists.

---

## User Flows

- **View financial snapshot:** User lands on `/dashboard` after login and immediately sees their net worth, this month's income/expenses, and how much they've saved so far this month, each with a trend indicator vs. last month.
- **Explore cashflow history:** User toggles between `6M` / `1Y` / `All` on the cashflow chart to see a longer or shorter income-vs-expense trend line.
- **Check spending mix:** User sees a donut chart of their top 5 expense categories for the current month, with a "Details" link through to `/categories`.
- **Jump to recent activity:** User sees their 5 latest transactions (income and expense merged) and can click "See all" to go to `/expenses` for the full history.

---

## Frontend

**Route / Page**

| File | Role |
| --- | --- |
| `app/(private)/dashboard/page.tsx` | Route entry point — re-exports `DashboardPage` |
| `features/dashboard/components/DashboardPage.tsx` | Main page component; owns the `useDashboardSummary()` call and composes all sections |

**Components**

| Component | Responsibility |
| --- | --- |
| `DashboardPage` | Renders the greeting (session user's first name + current month), 4 stat tiles, and the chart/donut/recent-activity rows. Computes stat-tile trend badges from `DashboardSummary`. |
| `IncomeExpenseChart` | Self-contained cashflow `AreaChart` (Recharts). Owns its own `range` state (`'6M' \| '1Y' \| 'All'`) and calls `useDashboardTrend(range)` directly — refetches independently of the rest of the page when the range toggle changes. |
| `CategoryDonutChart` | Purely presentational `PieChart` (Recharts). Takes `categories` and `total` as props from `DashboardPage` (shares the same `useDashboardSummary()` data as the stat tiles, so it does not fetch on its own). Shows an empty state when `categories` is empty and guards `total === 0` to avoid `NaN%` in the legend. |
| `RecentActivityCard` | Fetches its own data via `useDashboardRecentActivity()`. Maps each `ActivityItem` to the `TxRow` shape (`recentActivityColumns.tsx`) via a co-located `toTxRow()` mapper, reusing `formatActivityDate` from the `activity` feature. Shows a skeleton while loading and a "No activity yet" empty state. |

**Hooks**

| Hook | Query key | What it does |
| --- | --- | --- |
| `useDashboardSummary` | `['dashboard', 'summary']` | Fetches `GET /api/dashboard/summary` — balance, account count, income/expense/saved figures with trend %, and the top-5 category breakdown. |
| `useDashboardTrend` | `['dashboard', 'trend', range]` | Fetches `GET /api/dashboard/trend?range=` — parameterized by range so the chart's range toggle only refetches the chart. |
| `useDashboardRecentActivity` | `['dashboard', 'recent-activity']` | Fetches `GET /api/activity?type=ALL&pageSize=5` — reuses the existing `activity` feature's endpoint and types rather than duplicating pagination logic. |

No forms/Zod schemas — the dashboard is read-only.

---

## Backend

**Base path:** `/api/dashboard`

**Endpoints**

| Method | Path | Auth | Query | Success response |
| --- | --- | --- | --- | --- |
| `GET` | `/api/dashboard/summary` | Required | — | `{ success: true, data: DashboardSummary }` |
| `GET` | `/api/dashboard/trend` | Required | `range?: '6M' \| '1Y' \| 'All'` (default `'1Y'`) | `{ success: true, data: DashboardTrendPoint[] }` |

`DashboardSummary`:
```ts
{
  balance: number;
  accountsCount: number;
  income: { total: number; count: number; trendPct: number | null };
  expense: { total: number; count: number; trendPct: number | null };
  saved: { amount: number; pctOfIncome: number | null };
  categoryBreakdown: { name: string; icon: string; color: string; value: number }[];
}
```

`DashboardTrendPoint`: `{ month: string; income: number; expenses: number }` — `month` is labeled `'MMM YY'` (e.g. `"Jul 26"`) so multi-year ranges never collide.

**Middleware chain**

```
authMiddleware → getSummaryController / getTrendController → dashboardService
```

(No `validate(schema)` middleware — both endpoints are `GET` with no body. The `trend` endpoint's `range` query param is validated inline via `dashboardTrendQuerySchema.safeParse(req.query)` inside the controller, per this repo's convention that the `validate()` middleware only reads `req.body`.)

**Business rules**

- "Current month" and "previous month" are always derived from the server's current UTC date via `dayjs.utc()` — never caller-supplied. This matches `incomeService`'s use of `getUTCMonth()`/`getUTCFullYear()` when deriving `Income.month`/`Income.year`, so income and expense totals are scoped to the same calendar month regardless of the server's local timezone.
- `balance` and `accountsCount` are computed by reusing `accountService.getSummary()`'s `netWorth` and `accounts.length` — not reimplemented.
- Income totals filter on `Income.month`/`Income.year` (indexed); expense totals filter on an `Expense.date` UTC month-start/month-end range (Expense has no stored month/year columns).
- `trendPct(current, previous)` returns `null` when `previous <= 0` (no usable baseline) — the frontend omits the trend badge entirely in that case rather than showing a misleading `0%`/`+∞%`.
- Category breakdown sums the current month's expenses by `categoryId`, sorts descending, and caps at the top 5. Missing category `icon`/`color` fall back to `'pi-tag'` / `'#6b7280'`.
- `getTrend`'s `'All'` range starts from the earlier of the user's first Income or first Expense date, capped at 36 months back (`ALL_RANGE_MAX_MONTHS`) so very old accounts don't return unbounded chart data. Every month in the window is pre-seeded with `{income: 0, expenses: 0}` so zero-activity months appear as `0`, not a gap in the chart.
- Aggregation is done in JS (`.reduce()`/`Map`) rather than Prisma `groupBy`/`aggregate`, matching the rest of this codebase's established convention (see `accountService.getSummary`).

**Error cases**

| Code | HTTP | When |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `VALIDATION_ERROR` | 400 | `range` query param on `/trend` is not one of `'6M' \| '1Y' \| 'All'` |

---

## Data Model

No dedicated Prisma model — the dashboard reads from existing models:

```prisma
model Income {
  userId     String
  accountId  String
  categoryId String
  amount     Float
  date       DateTime
  month      Int
  year       Int
  @@index([userId, year, month])
}

model Expense {
  userId     String
  categoryId String
  accountId  String
  amount     Float
  date       DateTime
  @@index([userId, date])
}

model Account {
  userId  String
  type    AccountType // BANK | INVESTMENT | CRYPTO | CASH | CREDIT
  balance Float @default(0)
}

model Category {
  userId String?
  name   String
  icon   String?
  color  String?
  type   CategoryType // EXPENSE | INCOME
}
```

There is no `Budget` or `Goal` model — the dashboard intentionally does not show budget-limit or savings-goal widgets.

---

## Dependencies

- **Auth** — both endpoints require a valid JWT; `userId` is scoped from `req.user.id`, never caller-supplied.
- **Accounts** — reuses `accountService.getSummary()` for balance/net worth.
- **Activity** — reuses the existing `GET /api/activity` endpoint (via a dedicated `useDashboardRecentActivity` hook) for the recent-transactions feed instead of duplicating the merged Expense+Income query logic.
- **Categories** — category `name`/`icon`/`color` are joined in for the spending-by-category breakdown.

---

## Notes

- The "Balance" stat tile has no trend badge — there's no month-over-month net-worth-delta concept in scope; adding one would require snapshotting historical balances.
- The "Saved" stat tile's trend badge is derived (`'Positive'`/`'Negative'` based on sign) rather than judged against a real budget, since no `Budget` model exists to say what "on track" means.
- `IncomeExpenseChart` fetches independently of `DashboardPage`'s `useDashboardSummary()` call so that toggling the `6M`/`1Y`/`All` range only refetches the chart, not the whole page.
- A prior prototype version of this page rendered "Budget Progress" and "Savings Goals" sections from hardcoded mock data (`SAMPLE.budgets`/`SAMPLE.goals`). These were removed along with the mock data file (`data.ts`) and their components (`BudgetProgressSection.tsx`, `GoalsCard.tsx`) rather than wired to fake data, since no backing model exists.
