# Documentation Index

## Architecture

- [Architecture Overview](ARCHITECTURE.md) — Tech stack decisions, route access, API format, DB schema, deployment

## Features

- [Categories](features/categories.md) — Create, manage, and organise expense and income categories with icons and colours
- [Expenses](features/expenses.md) — Record expense transactions; atomic account balance updates; date-range filtering
- [Income](features/income.md) — Record income transactions; atomic account balance updates; month/year derived from date
- [Recurring](features/recurring.md) — Scheduled income and expense rules; lazy catch-up engine; pause/resume; manual trigger
- [Transactions](features/transactions.md) — Unified modal for creating one-off or recurring income/expense entries

## API Reference

- See [Architecture Overview](ARCHITECTURE.md) for full endpoint reference

## Guides

- [Migrating Recurring to a Server-Side Cron](guides/recurring-cron.md) — node-cron and BullMQ options to replace the current lazy catch-up approach
