# Budget Tracker

A full-stack budgeting and expense tracker: track balances across accounts (bank, investment, crypto, cash, credit), log income and expenses against categories, automate recurring transactions, and see it all summarized on a dashboard.

Frontend and backend are separate apps — each develops and deploys independently.

New to this codebase? Start with **[docs/ONBOARDING.md](docs/ONBOARDING.md)** — a guided walkthrough of what the app does, how a request flows end to end, and where to read the code first.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, PrimeReact, NextAuth.js
- **Backend:** Node.js, Express.js, TypeScript, Prisma, PostgreSQL

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full breakdown and reasoning behind each choice.

## Quick Start

```bash
# 1. Start local Postgres
docker-compose up -d

# 2. Backend
cd backend
pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm dev              # http://localhost:4000

# 3. Frontend (in a second terminal)
cd frontend
pnpm install
pnpm dev              # http://localhost:3000
```

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in `JWT_SECRET`.

The frontend needs its own `frontend/.env.local` (no example file is checked in yet — never commit it):

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Testing

```bash
# Backend — Jest. Use npx, not pnpm test (fails on the bcrypt build-script policy)
cd backend && npx jest

# Frontend — Vitest
cd frontend && pnpm test:run
```

## Docs

- [docs/ONBOARDING.md](docs/ONBOARDING.md) — start here if you're new to the project
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack decisions, route access, API reference, database schema
- [docs/INDEX.md](docs/INDEX.md) — per-feature documentation
- [CLAUDE.md](CLAUDE.md) — conventions and rules this project follows (frontend/backend patterns, testing, auth flow)
