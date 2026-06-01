# Transactions (Add Transaction Modal)

> A unified modal for recording a one-off or recurring income or expense transaction from anywhere in the app.

**Status:** Implemented
**Route:** Modal — opened from AppShell (no dedicated page route)
**Last updated:** 2026-06-01

---

## Overview

`AddTransactionModal` is the primary entry point for creating transactions. It supports both income and expense entry in a single modal, with a "Repeat this transaction" checkbox that switches the submission target from a one-off record to a recurring rule. The modal is accessible from the desktop topbar "New Transaction" button and the mobile floating action button (FAB), both wired in `AppShell`.

---

## User Flows

- **One-off expense:** Open modal → select "Expense" → fill amount, category, account, date, optional description → Save → `POST /api/expenses`, account balance decremented.
- **One-off income:** Open modal → select "Income" → fill amount, category, account, date, optional note → Save → `POST /api/income`, account balance incremented.
- **Recurring transaction:** Either form → check "Repeat this transaction" → choose frequency → Save → `POST /api/recurring`, first occurrence materialised immediately if start date ≤ today.
- **Type toggle:** Switching between Expense and Income carries the selected account across; both forms reset completely on modal open.

---

## Frontend

**Component**

| File                                                       | Role                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `features/transactions/components/AddTransactionModal.tsx` | Full modal — both forms, type toggle, repeat section |

**Sub-components** (private to the file)

| Component       | Responsibility                                                          |
| --------------- | ----------------------------------------------------------------------- |
| `AmountField`   | Number input with S$ currency prefix                                    |
| `AccountPicker` | Pill-button account selector; label changes ("Pay from" / "Deposit to") |
| `DateField`     | Date input with calendar icon                                           |
| `RepeatSection` | Repeat checkbox + frequency pill buttons (shown when checked)           |
| `NoteField`     | Optional text input for description / note                              |
| `FormActions`   | Cancel + Save buttons; shows loading spinner while pending              |

**Forms**

Two separate `react-hook-form` instances are used (one per transaction type) to keep validation errors isolated when the user switches between Expense and Income.

| Schema file                                  | Fields                                                      | Key validation                                                          |
| -------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `features/expenses/schemas/expenseSchema.ts` | `accountId`, `categoryId`, `amount`, `date`, `description?` | accountId, categoryId, amount, date required; description max 255 chars |
| `features/income/schemas/incomeSchema.ts`    | `accountId`, `categoryId`, `amount`, `date`, `note?`        | accountId, categoryId, amount, date required; note max 255 chars        |

**Hooks used**

| Hook               | Endpoint              | Mode                                                  |
| ------------------ | --------------------- | ----------------------------------------------------- |
| `useCreateExpense` | `POST /api/expenses`  | One-off expense                                       |
| `useCreateIncome`  | `POST /api/income`    | One-off income                                        |
| `useCreateRule`    | `POST /api/recurring` | Repeat mode (either type)                             |
| `useAccounts`      | `GET /api/accounts`   | Populates account picker                              |
| `useCategories`    | `GET /api/categories` | Populates category picker; filtered by `CategoryType` |

**Repeat mode behaviour**

When "Repeat this transaction" is checked:

- Frequency pills (Daily / Weekly / Monthly / Yearly) appear below the checkbox.
- On submit, instead of calling `createExpense` or `createIncome`, the modal calls `createRule` with `kind`, `amount`, `accountId`, `categoryId`, `note/description`, `frequency`, and `startDate` (taken from the date field).
- The recurring rule engine immediately materialises the first occurrence if `startDate ≤ today`.

**AppShell wiring**

`AddTransactionModal` is rendered once inside `AppShell`. Open/close state is managed by a single `useState` in `AppShell`. Both the desktop "New Transaction" button and the mobile FAB call `setTxModalOpen(true)`.

---

## Backend

This component has no dedicated backend endpoint. It delegates to:

- `POST /api/expenses` — one-off expense
- `POST /api/income` — one-off income
- `POST /api/recurring` — recurring rule (either kind)

See [Expenses](expenses.md), [Income](income.md), and [Recurring](recurring.md) for the full endpoint documentation.

---

## Dependencies

- **Expenses** — one-off expense creation
- **Income** — one-off income creation
- **Recurring** — repeat-mode rule creation
- **Accounts** — account picker data
- **Categories** — category picker data (EXPENSE and INCOME types)

---

## Notes

- Two separate form instances rather than one dynamic schema provide cleaner error isolation — switching type doesn't carry over validation state.
- PrimeReact `Checkbox` in unstyled mode renders a hidden native `<input>` alongside the custom visual element. Always add `input: { className: 'sr-only' }` to the `pt` prop to suppress the duplicate.
- The `checked` state of the checkbox is driven by the `repeat` prop directly (not `data-p-checked`) because PrimeReact sets `data-p-checked` on the root element, not the `box` child — inline conditional classes on `pt.box` are required for correct visual styling.
