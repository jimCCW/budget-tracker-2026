# CLAUDE.md

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

# Prisma (run from backend/)
npx prisma generate        # regenerate client after schema changes
npx prisma studio          # visual DB browser at localhost:5555
```

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, NextAuth.js
- **Data fetching:** Axios + TanStack Query — use `apiClient` from `lib/api.ts` inside `useQuery`/`useMutation` hooks
- **Forms:** react-hook-form + Zod — always define Zod schema first, infer type, pass zodResolver to useForm
- **Charts:** Recharts
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
│   └── (private)/            # dashboard/, income/, expenses/, categories/, summary/
├── features/
│   ├── auth/                 # components/ hooks/ schemas/
│   ├── income/               # components/ hooks/ schemas/ — expenses/ and categories/ follow same structure
│   └── summary/              # components/ hooks/
├── components/
│   ├── ui/                   # Primitives: Button, Input, Select, Modal, Badge
│   └── charts/               # Generic Recharts wrappers
├── lib/
│   ├── api.ts                # Typed fetch client → backend
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

### Forms

- Every form must have a Zod schema — no unvalidated inputs
- Frontend Zod schemas go in `features/<name>/schemas/` — schemas are **not** shared with the backend via a package; each layer defines its own
- Frontend uses **Zod v4** (`import { z } from 'zod'`); backend uses **Zod v3** — APIs differ (e.g. v4: `z.email()`, v3: `z.string().email()`). Never cross-import.
- Always infer the TypeScript type from the schema: `type T = z.infer<typeof schema>`
- Use `useForm<T>({ resolver: zodResolver(schema) })`
- PrimeReact `Checkbox` in unstyled mode renders a native `<input>` alongside the custom `pt.box`, causing a double checkbox. Always add `input: { className: 'sr-only' }` to the `pt` prop.

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

### General

- TypeScript strict mode — no `any`
- Never commit `.env.local`
- pnpm: if a new package has build scripts (native binaries, Prisma, etc.), add it to `onlyBuiltDependencies` in the relevant `pnpm-workspace.yaml` or pnpm will error with `ERR_PNPM_IGNORED_BUILDS`. If the native binding is still missing after install (e.g. bcrypt `bcrypt_lib.node` not found), run `node_modules/.bin/node-pre-gyp install --fallback-to-build` from inside the package directory (e.g. `node_modules/.pnpm/bcrypt@*/node_modules/bcrypt`).

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
- Recurring expenses: `isRecurring: true`, `recurrence: "MONTHLY"`
- SavingsBase is one-to-one with User — upsert, never insert a duplicate
- User data must always be scoped to `req.user.id` — never trust userId from request body

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

- Each expense belongs to a category — category is required
- Categories are either system defaults (`userId: null`) or user-created (`userId` set)
- Income is recorded per month+year — multiple entries per month allowed
- SavingsBase = user's starting bank balance; running total = SavingsBase + cumulative net savings
- Monthly net = total income − total expenses for that month
