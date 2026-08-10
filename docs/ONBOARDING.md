# Onboarding

Welcome. This doc is for a newcomer — human or AI — who needs to get productive in this codebase without reading every file first. It complements [ARCHITECTURE.md](ARCHITECTURE.md) (the reference) with a narrative: what the app does, how to get running, what order to read code in, and the conventions that will otherwise cost you an afternoon of debugging.

---

## What This App Does

It's a personal budgeting tool. The mental model:

- A user has one or more **accounts** — `BANK`, `INVESTMENT`, `CRYPTO`, `CASH`, or `CREDIT` — each with a running `balance`. Recording an income or expense against an account atomically updates that balance.
- Every income and expense belongs to a **category** (required, never optional). Categories are either system defaults (`userId: null`, seeded on setup, never hard-deletable) or user-created.
- A **`SavingsBase`** is the user's starting bank balance before the app started tracking anything — it's one-to-one with the user (always upsert, never a second row). The dashboard's running total is `SavingsBase + cumulative net savings`.
- **Recurring transactions** are governed by `RecurringRule` + a lazy catch-up engine (see [docs/guides/recurring-cron.md](guides/recurring-cron.md) for the design and a possible migration to a real cron). `Expense.isRecurring`/`Expense.recurrence` are legacy fields — dead, never write to them.
- **`creditDebt`** is derived, not stored: `Σ max(-balance, 0)` across `CREDIT` accounts, since those balances go negative as spending accrues.
- Income rows store `month`/`year` derived from the UTC date, specifically so monthly summary queries don't need to compute it — and because multiple income entries per month are allowed, unlike a naive "one row per month" model.

If a number on the dashboard looks wrong, these five rules are almost always why — check them before the code.

---

## Guided Reading Path

Reading the whole codebase file-by-file doesn't build a mental model efficiently. This order does:

1. **`backend/prisma/schema.prisma`** — the domain, in one file. Every model and relation the app is built around.
2. **`backend/src/index.ts`** — the 11 mounted routers. This is the map of "what can this backend even do."
3. **One vertical slice, end to end** — pick **accounts**, the simplest full CRUD feature, and read it top to bottom:
   - `frontend/app/(private)/accounts/page.tsx` → `frontend/features/accounts/components/AccountsPage.tsx` (and `AccountCard`, `AccountFormModal`)
   - `frontend/features/accounts/hooks/useAccounts.ts` (the TanStack Query read) and `useCreateAccount.ts` (the mutation)
   - `frontend/lib/api.ts` — see how the hook's call actually reaches the network
   - `backend/src/routes/accountRoutes.ts` → `authMiddleware` → `validate(accountSchemas)` → `backend/src/controllers/accountController.ts` → `backend/src/services/accountService.ts` (the business logic — ownership checks, balance updates) → Prisma

   Once this one slice makes sense, every other feature is the same shape with different fields.

4. **`frontend/proxy.ts`** and the [Auth Flow](ARCHITECTURE.md#auth-flow) section of ARCHITECTURE.md — how a request gets authenticated before it ever reaches step 3.
5. From there, [docs/INDEX.md](INDEX.md) has one doc per feature with the specifics — read them as you touch each feature, not all up front.

---

## How a Request Actually Flows

Worth internalizing once, since every feature repeats it:

```
Component → TanStack Query hook → apiClient (lib/api.ts, injects Bearer token)
  → Express route → authMiddleware (verifies JWT + session) → validate(schema)
  → controller (request/response only) → service (business logic, Prisma calls)
  → { success: true, data } or { success: false, error: { code, message } }
```

The response always has that exact shape — see [ARCHITECTURE.md → Standard API Response Format](ARCHITECTURE.md#standard-api-response-format). Every mutation's error handling assumes it.

---

## Conventions That Will Bite You

These aren't arbitrary — each one exists because of a real failure mode. `CLAUDE.md` has the full list; these are the ones most likely to trip up new work:

- **`apiClient` unwraps `response.data`.** A call like `apiClient.get<never, Account[]>('/api/accounts')` returns `Account[]` directly, not an `AxiosResponse`. And the rejection is a plain `{ code, message }` object, **not** an `Error` instance — always guard with `error instanceof Error ? error.message : 'Something went wrong.'`.
- **Any `401` force-signs the user out.** The interceptor treats it as a dead token. A route re-verifying a secondary credential (e.g. "confirm current password") must answer `403`, never `401`, or a typo in a password field logs the user out.
- **PrimeReact runs unstyled.** Every component needs `pt` passthrough props for styling — a bare `<Button>` with a `className` does nothing. See the PrimeReact table in `CLAUDE.md` before reaching for a native `<button>`/`<input>`/`<select>`.
- **`AppShell` is a per-page wrapper, not a Next.js layout.** It remounts on every navigation, so hooks inside it re-run each time. A TanStack Query hook there needs `staleTime` set to match `refetchInterval`, or it refetches on every route change.
- **Prisma `update`/`delete` only accept unique fields in `where`.** Ownership checks are `findFirst({ where: { id, userId } })` then `update({ where: { id } })` — or `deleteMany({ where: { id, userId } })`, throwing 404 on `count === 0`.
- **`break`/`continue` can't cross an async callback boundary** inside `prisma.$transaction(async tx => {...})`. Hoist early-exit guards before the `await`.

## Where to Add Things

Adding a new feature touches files in roughly this order — see `CLAUDE.md`'s Folder Structure sections for the full picture:

**Backend:** `prisma/schema.prisma` (if new data) → `schemas/<name>Schemas.ts` → `services/<name>Service.ts` → `controllers/<name>Controller.ts` → `routes/<name>Routes.ts` (wired in `authMiddleware → validate → controller` order) → registered in `src/index.ts`.

**Frontend:** `features/<name>/schemas/` (Zod first, always) → `features/<name>/hooks/` (TanStack Query) → `features/<name>/components/` → a thin `app/(private)/<name>/page.tsx` that renders one feature component.

If a component is useful in more than one feature, it moves to `components/` — never duplicated.

## Two Test Runners

- **Backend: Jest.** Run with `npx jest` from `backend/` — `pnpm test` fails on the bcrypt native build-script policy.
- **Frontend: Vitest.** Run with `pnpm test:run` from `frontend/`.

They're split because the backend and frontend are genuinely separate applications with separate dependency trees — there's no shared test config to reconcile.

---

## Working with Claude Code in This Repo

This repo has custom Claude Code skills and hooks under [.claude/](../.claude/) that automate the workflows below. If you're driving Claude Code here, reach for these rather than asking for the equivalent steps manually — they encode decisions (branch naming, commit format, doc sync) that are easy to get subtly wrong by hand.

| Situation                              | Skill           | What it does                                                                                                          |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Starting work for the day              | `dev-start`     | Brings up Docker Postgres, the backend, and the frontend. Only runs when asked explicitly — it won't fire on its own. |
| Building something new                 | `new-feature`   | The main entry point for new work — see below, it's an orchestrator.                                                  |
| Fixing a bug or making a small change  | `fix-update`    | Same shape as `new-feature`, scoped tighter: branches `fix/` or `update/`, plans before writing code.                 |
| Ready to ship what you have            | `commit-push`   | Drafts a Conventional Commits message, shows it for approval, then pushes.                                            |
| Documenting a feature after the fact   | `feature-docs`  | Writes/updates `docs/features/<name>.md` and keeps `docs/INDEX.md` in sync.                                           |
| Backend function missing a JSDoc block | `backend-jsdoc` | Self-triggers after edits under `services/`, `controllers/`, `middleware/` — see hooks below.                         |

**`new-feature` is an orchestrator, not a single step.** Its six phases already call `feature-dev`, `backend-jsdoc`, `feature-docs`, the test suites, code review, and `commit-push`'s push+PR step internally. Going through `new-feature` for a new feature means you don't invoke those individually — they're for standalone use only (e.g. documenting an already-shipped feature via `feature-docs` on its own). `fix-update` follows the same pattern at smaller scope.

**Three hooks run automatically**, configured in [.claude/settings.json](../.claude/settings.json) — not invoked by name, just background behavior to be aware of:

- After every file edit: `check-backend-jsdoc.sh` flags backend functions missing JSDoc, and `prettier-format.sh` formats the file that was just touched.
- At the end of each turn: `prettier-format-all.sh` formats everything.

In practice this means: don't hand-format code, and don't be alarmed if a file you just saved changes again a moment later — that's Prettier, not a bug. Config is in `.prettierrc`.
