# Documentation Index

## Start Here

- [Onboarding](ONBOARDING.md) — What this app does, a guided reading path through the code, and how to work with Claude Code in this repo

## Architecture

- [Architecture Overview](ARCHITECTURE.md) — Tech stack decisions, route access, API format, DB schema, deployment

## Features

- [Accounts](features/accounts.md) — Track balances across bank, cash, investment, crypto, and credit accounts; net worth breakdown
- [Activity](features/activity.md) — Unified, filterable, paginated feed of expense and income transactions with Excel export
- [Auth](features/auth.md) — Register, activate, log in, and reset a forgotten password, with per-device session tracking
- [Categories](features/categories.md) — Create, manage, and organise expense and income categories with icons and colours
- [Dashboard](features/dashboard.md) — Home view with balance/income/expense/savings stat tiles, cashflow trend chart, spending-by-category donut, and recent activity
- [Expenses](features/expenses.md) — Record expense transactions; atomic account balance updates; date-range filtering
- [Income](features/income.md) — Record income transactions; atomic account balance updates; month/year derived from date
- [Notifications](features/notifications.md) — Recurring transaction alerts with unread badge, infinite scroll, date grouping, category icon/color
- [Recurring](features/recurring.md) — Scheduled income and expense rules; lazy catch-up engine; pause/resume; manual trigger
- [Settings](features/settings.md) — Profile editing, password change, real session tracking with per-request revocation, currency/region display
- [Transactions](features/transactions.md) — Unified modal for creating one-off or recurring income/expense entries

## API Reference

- See [Architecture Overview](ARCHITECTURE.md) for full endpoint reference

## Guides

- [Migrating Recurring to a Server-Side Cron](guides/recurring-cron.md) — node-cron and BullMQ options to replace the current lazy catch-up approach
