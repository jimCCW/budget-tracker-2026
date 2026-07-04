# Activity

> Gives the user a single, filterable, paginated feed of every transaction (expense or income) they've recorded, with the ability to export the filtered results to Excel.

**Status:** Implemented
**Route:** `/activity`
**Last updated:** 2026-07-04

---

## Overview

Activity merges the user's `Expense` and `Income` records into one chronological feed instead of requiring two separate views. It supports filtering by transaction type, category, a date-range preset, and free-text search over the note/description, and it paginates the merged result set 10 rows at a time. Recurring transactions (rows materialised by the recurrence engine) are visually flagged with a badge rather than shown separately, since they already land in the same `Expense`/`Income` tables via `recurringRuleId`. The filtered result set — not just the current page — can be exported as an `.xlsx` file.

This is a read-only reporting feature: it does not create, edit, or delete transactions itself (that remains the job of `AddTransactionModal` — see [Transactions](transactions.md)).

---

## User Flows

- **Browse activity:** Navigate to `/activity` → sees the most recent transactions first, 10 per page.
- **Filter by type:** Click "All" / "Income" / "Expense" in the left panel → feed and pagination reset to page 1.
- **Filter by category:** Click a category in the left panel (list is the union of both expense- and income-type categories) → feed narrows to that category.
- **Filter by date range:** Click a preset — Today / This week / This month / Last 3 months / All time → feed narrows to that computed range (computed client-side via `dayjs`, no custom date picker).
- **Search:** Type in the search box → after a 350ms debounce, results filter by a case-insensitive substring match against the note/description.
- **Paginate:** Click the prev/next arrows → fetches the next/previous page via cursor, without re-scanning already-seen rows.
- **Export:** Click "Export" → downloads an `.xlsx` file containing every row matching the current filters (not limited to the current page).

---

## Frontend

**Route / Page**

| File                                            | Role                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `app/(private)/activity/page.tsx`               | Thin re-export of `ActivityPage`                                 |
| `features/activity/components/ActivityPage.tsx` | Owns filter/pagination state; composes the panel, bar, and table |

**Components**

| Component                         | Responsibility                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ActivityFilterPanel`             | Left sidebar — Type / Category / Date Range sections, each a vertical list of clickable rows            |
| `ActivitySearchExportBar`         | Search input (debounced 350ms) + Export button                                                          |
| `activityColumns` (`ColumnDef[]`) | Table column definitions: description+icon+recurring badge, category pill, date, account, signed amount |

**Hooks**

| Hook                | Query key / Mutation            | What it does                                                                                                                                               |
| ------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useActivity`       | `['activity', filters, cursor]` | Fetches one page of the merged feed; `placeholderData: keepPreviousData` avoids flicker between pages; `staleTime: 30_000` per the AppShell-remount caveat |
| `useExportActivity` | mutation (no query key)         | Requests `/api/activity/export` as a blob, triggers a browser download via a temporary `<a download>`                                                      |

**Pagination model** — `ActivityPage` keeps a 0-based `pageIndex` and a `cursorStack: (string | null)[]` (`cursorStack[0] = null`). Since the UI only exposes prev/next arrows (no jump-to-page), a user can only reach page _N_ by having already fetched pages `1..N-1`, so `cursorStack[next]` is always already known when navigating backward; navigating forward pushes the just-fetched `nextCursor` onto the stack. Any filter change resets both `pageIndex` and `cursorStack`.

**`DataTable` extension** — `components/ui/DataTable.tsx` gained optional `manualPagination`, `pageCount`, `pageIndex`, `onPageChange`, and `totalCount` props to support server-side pagination (previously client-side only, via TanStack's `getPaginationRowModel()`). When `manualPagination` is set, `data` is treated as an already-fetched page and the footer shows a "Showing X–Y of Z" label instead of just "Page X of Y". These props are all optional and default to the prior client-side behavior, so the only other consumer (`features/dashboard/components/RecentActivityCard.tsx`) is unaffected.

---

## Backend

**Base path:** `/api/activity`

**Endpoints**

| Method | Path                   | Auth     | Query                                                                   | Success response                                                                                 |
| ------ | ---------------------- | -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/activity`        | Required | `type?, categoryId?, startDate?, endDate?, search?, cursor?, pageSize?` | `{ success: true, data: { items: ActivityItem[], nextCursor, hasNextPage, total, totalPages } }` |
| `GET`  | `/api/activity/export` | Required | `type?, categoryId?, startDate?, endDate?, search?`                     | `.xlsx` file stream (`Content-Disposition: attachment`)                                          |

Query params are validated via `activityQuerySchema.safeParse(req.query)` directly in the controller — there is no `validate()` middleware in the chain, since that middleware only reads `req.body` and these are GET routes.

**Middleware chain**

```
authMiddleware → controller → service
```

**Business rules**

- `userId` is always scoped from `req.user.id`, never trusted from query params.
- Both endpoints call `runCatchupThrottled(userId)` first (same pattern as `expenseController`/`incomeController`), so freshly-materialised recurring transactions appear immediately.
- **Merge strategy:** `Expense` and `Income` are separate tables with no shared primary key, so the "activity feed" is produced by merging in application code rather than a raw SQL `UNION`. `getActivity` queries both tables in parallel (skipping whichever table `type` excludes entirely), merges the results, sorts by `(date desc, createdAt desc, id desc)`, and slices to the page.
- **Pagination is keyset (cursor), not offset:** each side query fetches `pageSize + 1` rows using a `(date, createdAt, id)` "less than the cursor" condition (expressed as nested Prisma `OR`), so the cost of a request stays ~O(pageSize) no matter how deep a user paginates — unlike naively fetching `page * pageSize` rows per table. `hasNextPage` is derived from whether the merged candidate count exceeds `pageSize`; the opaque `cursor` string is a base64-encoded JSON of the last row's sort key.
- `total`/`totalPages` come from separate `count()` calls per table (no cursor applied) — cheap, index-backed, and independent of pagination depth.
- `isRecurring` is derived as `recurringRuleId != null` — no separate recurring-activity concept exists; a recurring transaction is just an `Expense`/`Income` row with that field set.
- Search matches `Expense.description` / `Income.note` via `contains` with `mode: 'insensitive'` — it does **not** match category names.
- Export re-runs the same filters with no cursor/limit, so the file always reflects every matching row, not just one page. Amounts are written negative for `EXPENSE` rows so a spreadsheet `SUM()` produces the correct net total.

**Error cases**

| Code               | HTTP | When                                                         |
| ------------------ | ---- | ------------------------------------------------------------ |
| `UNAUTHORIZED`     | 401  | Missing or invalid JWT                                       |
| `VALIDATION_ERROR` | 400  | Invalid query params, or a malformed/tampered `cursor` value |

---

## Data Model

No new table — Activity reads directly from the existing `Expense` and `Income` models (see [Expenses](expenses.md) and [Income](income.md) for their full schemas). The merged, transport-level shape is:

```ts
type ActivityItem = {
  id: string;
  type: 'EXPENSE' | 'INCOME';
  date: string;
  amount: number;
  note: string | null; // Expense.description ?? Income.note
  isRecurring: boolean; // recurringRuleId != null
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  account: { id: string; name: string };
};
```

---

## Dependencies

- **Auth** — all endpoints require a valid JWT; `userId` is scoped from `req.user.id`
- **Expenses / Income** — Activity is a read-only projection over these two tables; it introduces no new persistence
- **Recurring** — recurring-generated rows are distinguished only by `recurringRuleId`; no separate recurring-event log is read
- **Categories** — the category filter list is sourced from `useCategories()` (both `EXPENSE`- and `INCOME`-type categories, combined)

---

## Notes

- There is no dedicated audit/activity log in this codebase — manual create/update/delete of `Expense`/`Income`/`RecurringRule` produce no log entry anywhere. This feature is a ledger view of existing data, not an audit trail of actions taken. Only the recurrence engine's materializations additionally create a `Notification` row (see [Recurring](recurring.md)).
- Date-range filtering is preset-only (Today / This week / This month / Last 3 months / All time), computed client-side via `dayjs`. There is no custom start/end date picker in this feature — if one is added later, `PrimeReact Calendar` would be a net-new integration (not used anywhere else in the app yet).
- The keyset cursor is a plain base64-encoded JSON string, not signed/encrypted — it's not a security boundary (all queries are still scoped by `userId` server-side), just an opaque pagination token.
