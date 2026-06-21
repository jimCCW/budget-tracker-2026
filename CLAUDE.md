# Budget Tracker

## Project

`claude-budget-tracking` is a full-stack budgeting and expense tracking app. Separate frontend and backend — each can be developed and deployed independently.

## Dev Commands

```bash
# Start local postgres
docker-compose up -d

# Backend
cd backend && pnpm install
npx prisma migrate dev
npx prisma db seed
pnpm dev

# Frontend
cd frontend && pnpm install
pnpm dev
pnpm tsc --noEmit    # type-check without building

# Backend type-check
cd backend && npx tsc --noEmit

# Prisma (run from backend/)
npx prisma generate        # regenerate client after schema changes
npx prisma studio          # visual DB browser at localhost:5555

# Schema changes (migrate dev requires TTY — use this pattern instead):
npx prisma db push --accept-data-loss   # sync DB to schema
# manually write migration SQL to backend/prisma/migrations/<name>/migration.sql
npx prisma migrate resolve --applied <name>   # record it in the migrations table

# Adding a NOT NULL column to an existing table — always backfill first:
# 1. ADD COLUMN nullable  2. UPDATE rows  3. ALTER COLUMN SET NOT NULL  4. ADD CONSTRAINT FK
```

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, NextAuth.js
- **Data fetching:** Axios + TanStack Query — use `apiClient` from `lib/api.ts` inside `useQuery`/`useMutation` hooks
  - `apiClient` auto-injects the Bearer token and unwraps `response.data` — callers receive the payload directly (e.g. `apiClient.get<never, Account[]>('/api/accounts')` returns `Account[]`, not `AxiosResponse`)
- **Forms:** react-hook-form + Zod — always define Zod schema first, infer type, pass zodResolver to useForm
- **Charts:** Recharts
- **Dates:** `dayjs` — installed in both frontend and backend. Use it for all date formatting and arithmetic instead of native `Date` methods.
- **Backend:** Node.js, Express.js, TypeScript
- **ORM/DB:** Prisma + PostgreSQL

---

## Frontend Rules

### Route Guards

Enforced in `proxy.ts` using NextAuth `getToken`. File is `proxy.ts` (Next.js 16+); exported function must be named `proxy`, not `middleware`.

- **Public routes:** `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Private routes:** everything else — unauthenticated users redirected to `/login`
- Authenticated users hitting `/login` or `/register` are redirected to `/dashboard`
- IMPORTANT: Never add auth checks inside page components — `proxy.ts` is the single source of truth. See `docs/ARCHITECTURE.md` for the implementation.

### Folder Structure (Feature-based)

```
frontend/
├── app/                      # Routing only — no logic or inline JSX
│   ├── (auth)/               # login/, register/ — public
│   └── (private)/            # dashboard/, income/, expenses/, categories/, summary/, accounts/
├── features/
│   ├── auth/                 # components/ hooks/ schemas/
│   ├── income/               # components/ hooks/ schemas/
│   ├── expenses/             # components/ hooks/ schemas/
│   ├── categories/           # components/ hooks/ schemas/
│   ├── dashboard/            # components/ hooks/
│   ├── accounts/             # components/ hooks/ schemas/ constants/
│   ├── recurring/            # components/ hooks/ schemas/ constants/
│   ├── transactions/         # components/  (AddTransactionModal — modal only, no page)
│   ├── notifications/        # components/ hooks/ utils/
│   └── summary/              # components/ hooks/
├── components/
│   ├── ui/                   # DataTable.tsx, Modal.tsx, StatCard.tsx, ThemeToggle.tsx
│   └── charts/               # Generic Recharts wrappers
├── lib/
│   ├── api.ts                # Typed fetch client → backend
│   ├── formatCurrency.ts     # Currency formatting helpers
│   └── auth.ts               # NextAuth config
├── types/
└── proxy.ts             # Route guard — single source of truth
```

### Component Rules

- IMPORTANT: Before creating a new component, check if a similar one exists in `components/` or the current feature's `components/` folder
- If a component is used in more than one feature, move it to `components/` immediately
- Never duplicate a component — extend via props instead
- `components/ui/` contains only primitives with no business logic or API calls
- Feature components go in `features/<name>/components/` — never directly in `app/`
- `app/` files should only import from `features/` and `components/` — no inline JSX logic
- `app/` page files must be minimal: a server component that resolves async data and renders ONE feature component. Simple case: `export { LoginPage as default } from '@/features/auth/components/LoginPage'`. With searchParams: an async function that awaits `searchParams` and passes as props. Never use `useSearchParams()` inside a `page.tsx` — it requires a Suspense boundary the page itself cannot provide; resolve `searchParams` server-side and pass as props instead.

### PrimeReact Components

- IMPORTANT: Always prefer PrimeReact components over native HTML elements. Precedence: **PrimeReact component → custom wrapper in `components/ui/` → native HTML (last resort)**
- Before writing a native `<button>`, `<input>`, `<select>`, `<table>`, or `<dialog>`/custom modal, check the mapping below first:

| Native HTML                           | PrimeReact component | Import path                                                                                                                                                  |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<button>`                            | `Button`             | `primereact/button`                                                                                                                                          |
| `<input>` / `<input type="text">`     | `InputText`          | `primereact/inputtext`                                                                                                                                       |
| `<input type="password">`             | `Password`           | `primereact/password`                                                                                                                                        |
| `<select>`                            | `Dropdown`           | `primereact/dropdown`                                                                                                                                        |
| `<textarea>`                          | `InputTextarea`      | `primereact/inputtextarea`                                                                                                                                   |
| `<input type="checkbox">`             | `Checkbox`           | `primereact/checkbox`                                                                                                                                        |
| `<input type="radio">`                | `RadioButton`        | `primereact/radiobutton`                                                                                                                                     |
| Custom modal / `createPortal` overlay | `Dialog`             | `primereact/dialog`                                                                                                                                          |
| `<table>`                             | `DataTable` (custom) | `@/components/ui/DataTable` — supports sorting, pagination, row selection via TanStack Table. **Do not use** `primereact/datatable` (React 19 incompatible). |
| `animate-pulse` loading skeleton div  | `Skeleton`           | `primereact/skeleton`                                                                                                                                        |
| Inline spinner icon                   | `ProgressSpinner`    | `primereact/progressspinner`                                                                                                                                 |
| Custom 3-dot/context dropdown menu    | `Menu` (popup mode)  | `primereact/menu`                                                                                                                                            |

- **Unstyled mode:** `PrimeReactProvider` uses `unstyled: true` — no default styles are applied. Every PrimeReact component must have `pt` passthrough props to apply Tailwind classes. Move existing `className` from native elements into the appropriate `pt` slot (usually `pt={{ root: { className: '...' } }}`).
- **Exception:** Use Next.js `<Link>` for navigation links (href-based). Only wrap with `Button` if the element triggers an action (no navigation intended).
- **Menu popup pattern:** Use `const menuRef = useRef<Menu>(null)` + `<Menu model={items} popup ref={menuRef} />` + `<Button onClick={(e) => menuRef.current?.toggle(e)} />`. Items use `{ label, icon, command }` shape (`import type { MenuItem } from 'primereact/menuitem'`).
- **Dialog pattern:** Use `visible`, `onHide`, `closable={false}`, `dismissableMask`. Apply overlay styles via `pt.mask`, panel styles via `pt.root`, inner scroll via `pt.content`. Suppress the built-in header with `pt={{ header: { className: 'hidden' } }}` when custom header UI is rendered inside `children`.

### Forms

- Every form must have a Zod schema — no unvalidated inputs
- Frontend Zod schemas go in `features/<name>/schemas/` — schemas are **not** shared with the backend via a package; each layer defines its own
- Frontend uses **Zod v4** (`import { z } from 'zod'`); backend uses **Zod v3** — APIs differ (e.g. v4: `z.email()`, v3: `z.string().email()`). Never cross-import.
- Always infer the TypeScript type from the schema: `type T = z.infer<typeof schema>`
- Use `useForm<T>({ resolver: zodResolver(schema) })`
- PrimeReact `Checkbox` in unstyled mode renders a native `<input>` alongside the custom `pt.box`, causing a double checkbox. Always add `input: { className: 'sr-only' }` to the `pt` prop.
- PrimeReact `Checkbox`: `data-p-checked` is set on the root, NOT on `pt.box` — `data-[p-checked=true]:bg-primary` in `pt.box` will silently do nothing. Drive checked styles from the React boolean prop directly: `pt={{ box: { className: checked ? 'bg-primary border-primary' : 'bg-surface border-border' } }}`

### Tailwind v4 Class Patterns

- Use semantic utility classes generated from `@theme` — `bg-danger-tint`, `rounded-md`, `text-text-muted` — not `bg-[var(--color-danger-tint)]` or `rounded-[10px]`
- Gradient direction: `bg-linear-to-br` (v4 name), not `bg-gradient-to-br` (v3)
- `@theme` (not `@theme inline`) generates utility classes from CSS variables; `.dark` override block in `globals.css` switches tokens for dark mode

### Icons

- Use PrimeIcons: `<i className="pi pi-{name}" />` — package `primeicons` installed, CSS imported in `layout.tsx`
- Common icons: `pi-envelope`, `pi-lock`, `pi-eye`, `pi-eye-slash`, `pi-times-circle`, `pi-sun`, `pi-moon`

### Theme

- `next-themes` is installed. `ThemeProvider` (in `Providers.tsx`) applies `class="dark"` to `<html>`; `.dark` in `globals.css` overrides all `--color-*` tokens
- Components using `useTheme()` must guard against SSR: `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []); if (!mounted) return null;`
- `ThemeToggle` primitive lives in `components/ui/ThemeToggle.tsx`

### AppShell

`AppShell` is a **wrapper inside each page component**, not a shared Next.js layout. It remounts on every navigation.

- Hooks called inside AppShell re-run on every route change.
- TanStack Query hooks with `staleTime: 0` will refetch on every navigation — set `staleTime` equal to `refetchInterval` to prevent this.

### General

- TypeScript strict mode — no `any`
- Use `||` not `??` when falling back from a string field that may be empty (`""`). `??` only catches `null`/`undefined`; `||` catches both. Example: `rule.note || rule.category?.name || 'Expense'`.
- Never commit `.env.local`
- pnpm: packages with native build scripts need `onlyBuiltDependencies` in `pnpm-workspace.yaml` — otherwise `ERR_PNPM_IGNORED_BUILDS`. If a native binding is still missing post-install, run `node_modules/.bin/node-pre-gyp install --fallback-to-build` from inside the package dir.

---

## Backend Rules

### Folder Structure

```
backend/
├── src/
│   ├── routes/          # Express routers — wire path to middleware chain + controller
│   ├── middleware/      # authMiddleware.ts, validate.ts, errorHandler.ts
│   ├── controllers/     # Request/response only — calls service layer
│   ├── services/        # All business logic lives here
│   ├── schemas/         # Zod schemas for request validation
│   ├── utils/           # Utility functions (e.g. appError.ts)
│   └── index.ts
├── prisma/              # schema.prisma, seed.ts
└── Dockerfile
```

### Middleware Chain

Every protected route must follow this order:

```
authMiddleware → validate(zodSchema) → controller
```

- `authMiddleware` — validates JWT, sets `req.user`. All routes except `/api/auth/*` must use this
- `validate(schema)` — validates request body against a Zod schema before the controller runs. Returns `VALIDATION_ERROR` immediately if invalid. Controllers must never receive unvalidated input. **Only reads `req.body`** — for GET endpoints needing query param validation, call `schema.safeParse(req.query)` directly in the controller
- Controllers call the service layer and return the response — no business logic in controllers

### Response Format

IMPORTANT: All API responses must follow this exact format — no exceptions.

**Success:** `{ "success": true, "data": <payload> }`

**Error:** `{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }`

Standard error codes and their HTTP status:

- `VALIDATION_ERROR` 400 — bad request body / query params
- `UNAUTHORIZED` 401 — missing or invalid JWT
- `FORBIDDEN` 403 — authenticated but not allowed
- `NOT_FOUND` 404 — resource does not exist
- `CONFLICT` 409 — duplicate resource (e.g. email already registered)
- `INTERNAL_ERROR` 500 — unexpected server error

### Database

- Never hard-delete default categories (`isDefault: true`) — guard in service layer
- SavingsBase is one-to-one with User — upsert, never insert a duplicate
- User data must always be scoped to `req.user.id` — never trust userId from request body
- Prisma `update`/`delete` only accept unique fields in `where`. For ownership checks: use `findFirst({ where: { id, userId } })` then `update({ where: { id } })`, or `deleteMany({ where: { id, userId } })` and throw 404 if `count === 0`.
- To backdate a record with `@default(now())`, pass `createdAt` explicitly in `prisma.create()` — Prisma allows overriding the default.
- `break` / `continue` cannot cross an async callback boundary (e.g. inside `prisma.$transaction(async tx => {...})`). Hoist early-exit guards **before** the `await prisma.$transaction(...)` call.

---

## Auth Flow

NextAuth credentials provider calls `POST /api/auth/login` → backend bcrypt-verifies and returns JWT → NextAuth stores in HTTP-only cookie → frontend sends `Authorization: Bearer <token>` → Express `authMiddleware` validates and sets `req.user`.

---

## Environment Variables

**`backend/.env`**

```
DATABASE_URL=postgresql://budgetuser:budgetpass@localhost:5432/budgetdb
JWT_SECRET=
PORT=4000
NODE_ENV=development
```

**`frontend/.env.local`**

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Key Domain Rules

- Each expense and income belongs to a category — `categoryId` is required on both
- Categories are either system defaults (`userId: null`) or user-created (`userId` set)
- Income stores `month` and `year` derived from the UTC date — used for monthly summary queries; multiple entries per month allowed
- SavingsBase = user's starting bank balance; running total = SavingsBase + cumulative net savings
- Monthly net = total income − total expenses for that month
- Account types: `BANK`, `INVESTMENT`, `CRYPTO`, `CASH`, `CREDIT` — tracked per user with `balance`, `icon`, `color`
- Recurring transactions are managed via `RecurringRule` + the recurrence engine. The legacy `isRecurring`/`recurrence` fields on `Expense` are unused — do not write to them.
- Shared constants (e.g. frequency config) go in `features/<name>/constants/` and may be imported cross-feature
