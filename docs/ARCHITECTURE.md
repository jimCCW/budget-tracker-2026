# Architecture — Budget Tracker

## Overview

Separate frontend and backend so each can scale and deploy independently.
Future expansion: investment P&L tracking (Phase 2).

## Stack Decisions

| Layer              | Choice                     | Reason                                                                                                    |
| ------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Frontend framework | Next.js App Router         | File-based routing, server components, easy auth integration                                              |
| Styling            | Tailwind CSS v4            | Utility-first, `@theme` tokens generate semantic utility classes                                          |
| UI components      | PrimeReact (unstyled mode) | Accessible primitives, no default styling to fight — see Frontend Rules in `CLAUDE.md`                    |
| Data fetching      | Axios + TanStack Query     | Axios for a typed HTTP client; TanStack Query for caching and mutations                                   |
| Forms              | react-hook-form + Zod      | Type-safe validation; frontend (Zod v4) and backend (Zod v3) each define their own schemas — never shared |
| Charts             | Recharts                   | React-native, composable, no build step                                                                   |
| Dates              | dayjs                      | Installed on both sides; used instead of native `Date` methods                                            |
| Theming            | next-themes                | `class="dark"` on `<html>`, tokens overridden in `globals.css`                                            |
| Auth               | NextAuth.js + JWT          | Native Next.js integration; backend validates the token independently                                     |
| Backend            | Express.js + TypeScript    | Lightweight, familiar, easy to extend                                                                     |
| ORM                | Prisma                     | Type-safe queries, auto migrations, great TypeScript DX                                                   |
| Database           | PostgreSQL                 | Relational model fits budgeting data; strong managed cloud options                                        |
| Validation         | Zod                        | Request validation on the backend, form validation on the frontend — schemas are not shared as a package  |

---

## Route Access

| Route              | Access                                         |
| ------------------ | ---------------------------------------------- |
| `/`                | Public — redirects to `/dashboard` or `/login` |
| `/login`           | Public                                         |
| `/register`        | Public                                         |
| `/forgot-password` | Public                                         |
| `/reset-password`  | Public                                         |
| `/dashboard`       | Private                                        |
| `/income`          | Private                                        |
| `/expenses`        | Private                                        |
| `/categories`      | Private                                        |
| `/accounts`        | Private                                        |
| `/recurring`       | Private                                        |
| `/activity`        | Private                                        |
| `/notifications`   | Private                                        |
| `/settings`        | Private                                        |

### Middleware Implementation (`frontend/proxy.ts`)

Uses NextAuth `getToken` to read the session cookie server-side. Runs on the Edge before any page renders — no client-side flicker. File is named `proxy.ts` (Next.js 16+) and exports `proxy`, not `middleware`. This is the **single source of truth** for route access — page components never implement their own auth checks.

```ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? '/dashboard' : '/login', req.url)
    );
  }

  const isPublic = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Auth Flow

NextAuth's credentials provider calls `POST /api/auth/login` → the backend bcrypt-verifies the password, opens a `UserSession` row (recording the login's `User-Agent`), and returns a JWT carrying that session's id as `sid` → NextAuth stores the JWT in an HTTP-only cookie → the frontend sends `Authorization: Bearer <token>` on every API call → Express's `authMiddleware` (async — the whole body is wrapped in try/catch, since Express 4 doesn't catch rejections from async middleware) verifies the JWT, looks up the `UserSession` by `sid`, and rejects with `401 UNAUTHORIZED` if it's missing or revoked, before setting `req.user`.

This session-tracking design means a JWT alone isn't sufficient for a request to succeed — its `sid` must still point at a live, unrevoked `UserSession` row. That's what lets a user revoke _other_ devices' sessions from Settings (`POST /api/sessions/:id/revoke`) without needing to change their password.

**Sign-out** (`frontend/lib/logout.ts`, used by `AppShell` and Settings) calls `POST /api/auth/logout` to revoke the current session server-side, then NextAuth `signOut()`.

**The 401-vs-403 rule:** the frontend's `apiClient` response interceptor treats _any_ `401` as a dead session and force-signs the user out (see `lib/api.ts`). That's correct for JWT/session problems, but wrong for a route that re-verifies a secondary credential — e.g. "confirm your current password" before a password change or account deletion. Those routes must respond `403 FORBIDDEN` on a mismatch, never `401`, or a simple wrong-password attempt turns into an unwanted logout. See `docs/features/settings.md` for the full design.

---

## Frontend — Feature-based Structure

```
frontend/
├── app/                       # Routing only — no logic or inline JSX
│   ├── page.tsx                # Landing page — redirects via proxy.ts
│   ├── (auth)/                 # Public
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (private)/              # Private — all guarded by proxy.ts
│   │   ├── dashboard/
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── categories/
│   │   ├── accounts/
│   │   ├── recurring/
│   │   ├── activity/
│   │   ├── notifications/
│   │   └── settings/
│   └── api/auth/[...nextauth]/ # NextAuth route handler
├── features/
│   ├── auth/                   # components/ hooks/ schemas/
│   ├── income/                 # hooks/ schemas/
│   ├── expenses/                # hooks/ schemas/
│   ├── categories/              # components/ hooks/ schemas/
│   ├── dashboard/                # components/ hooks/ types/
│   ├── accounts/                  # components/ hooks/ schemas/
│   ├── recurring/                  # components/ hooks/ schemas/ constants/
│   ├── transactions/                # components/  (AddTransactionModal — modal only, no page)
│   ├── notifications/               # components/ hooks/ utils/
│   ├── activity/                     # components/ hooks/ types/ utils/
│   └── settings/                      # components/ hooks/ schemas/
├── components/
│   ├── AppShell.tsx             # Per-page wrapper (not a shared layout) — see note below
│   ├── Providers.tsx             # PrimeReactProvider, QueryClientProvider, ThemeProvider
│   ├── SessionTokenSync.tsx       # Feeds lib/authToken.ts from the NextAuth session
│   └── ui/                         # DataTable.tsx, Modal.tsx, StatCard.tsx, ThemeToggle.tsx
├── lib/
│   ├── api.ts                   # Axios client → backend
│   ├── authToken.ts               # Access-token store read by api.ts
│   ├── formatCurrency.ts           # Currency formatting helpers
│   ├── dateUtils.ts                 # dayjs-based date helpers
│   ├── logout.ts                     # Shared sign-out
│   └── auth.ts                        # NextAuth config
└── types/
```

**`AppShell` is a wrapper inside each page component, not a shared Next.js layout** — it remounts on every navigation. Hooks called inside it re-run on every route change; TanStack Query hooks there need `staleTime` set explicitly or they refetch on every navigation.

---

## Backend — Layer Structure

```
backend/
├── src/
│   ├── routes/          # Express routers — wire path to middleware chain + controller
│   ├── middleware/
│   │   ├── authMiddleware.ts    # Validates JWT + session, sets req.user (async — see Auth Flow)
│   │   ├── validate.ts          # validate(zodSchema) — reusable request body validator
│   │   └── errorHandler.ts      # Global error handler → standard response format
│   ├── controllers/     # Request/response only — calls service, returns response
│   ├── services/        # All business logic lives here, incl. emailService.ts (activation/reset emails)
│   ├── schemas/          # Zod schemas for request validation
│   ├── utils/             # appError.ts, authorizationUtils.ts, recurrence.ts, userAgent.ts, activityExport.ts,
│   │                       # appUrl.ts (frontend URL builder), emailTemplates.ts (Handlebars renderer)
│   ├── templates/emails/   # layout.hbs + activation/password-reset .hbs + .txt.hbs — email HTML/text content
│   ├── lib/
│   │   ├── prisma.ts       # Shared Prisma singleton — always import from here, never `new PrismaClient()`
│   │   └── mailer.ts       # Nodemailer/SMTP transport — [DEV] console fallback when SMTP_HOST is unset
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── Dockerfile
```

`pnpm build` (`tsc && cp -r src/templates dist/templates`) copies the non-TS `templates/` folder into `dist/` alongside the compiled JS — `tsc` alone would otherwise drop it.

### Middleware Chain

Every protected route follows this order:

```
authMiddleware → validate(zodSchema) → controller
```

`validate` is a reusable middleware factory that accepts a Zod schema, parses `req.body`, and either passes validated data forward or returns a `VALIDATION_ERROR` response immediately. The controller receives only pre-validated, typed input. It only reads `req.body` — GET endpoints needing query param validation call `schema.safeParse(req.query)` directly in the controller.

```
// Route definition pattern (no code, concept only)
router.post('/expenses', authMiddleware, validate(createExpenseSchema), expenseController.create)
```

---

## Standard API Response Format

Every endpoint returns one of two shapes:

```ts
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

| Code               | HTTP | When                                                                                       |
| ------------------ | ---- | ------------------------------------------------------------------------------------------ |
| `VALIDATION_ERROR` | 400  | Invalid request body or query params                                                       |
| `UNAUTHORIZED`     | 401  | Missing or invalid JWT, or its session was revoked                                         |
| `FORBIDDEN`        | 403  | Authenticated but not allowed — also the secondary-credential mismatch case, see Auth Flow |
| `NOT_FOUND`        | 404  | Resource does not exist                                                                    |
| `CONFLICT`         | 409  | Duplicate resource (e.g. email already registered)                                         |
| `INTERNAL_ERROR`   | 500  | Unexpected server error                                                                    |

---

## Database Schema

The full schema lives in `backend/prisma/schema.prisma`; the shape below is trimmed to relations and semantics that aren't obvious from field names alone.

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  firstName    String
  lastName     String
  name         String?  // legacy — prefer firstName/lastName
  isActive     Boolean  @default(false)
  currency     String   @default("SGD")
  language     String   @default("English")
  // + activation/reset token fields
  incomes        Income[]
  expenses       Expense[]
  categories     Category[]
  savingsBase    SavingsBase?
  accounts       Account[]
  recurringRules RecurringRule[]
  notifications  Notification[]
  sessions       UserSession[]
}

model UserSession {
  id        String    @id @default(uuid())
  userId    String
  userAgent String?
  revokedAt DateTime? // non-null = revoked; see Auth Flow
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

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
  type    AccountType @default(BANK)
  balance Float       @default(0) // running balance, updated atomically on income/expense writes
  icon    String?
  color   String?
  incomes        Income[]
  expenses       Expense[]
  recurringRules RecurringRule[]
}

enum CategoryType {
  EXPENSE
  INCOME
}

model Category {
  id        String       @id @default(uuid())
  userId    String?      // null = system default (isDefault: true), never hard-deletable
  type      CategoryType @default(EXPENSE)
  isDefault Boolean      @default(false)
  expenses       Expense[]
  incomes        Income[]
  recurringRules RecurringRule[]
}

model Income {
  id              String   @id @default(uuid())
  userId          String
  accountId       String
  categoryId      String
  amount          Float
  date            DateTime
  month           Int      // derived from `date` (UTC) — used for monthly summary queries
  year            Int
  recurringRuleId String?  // set when generated by the recurrence engine
}

model Expense {
  id              String @id @default(uuid())
  userId          String
  categoryId      String
  accountId       String
  amount          Float
  date            DateTime
  isRecurring     Boolean         @default(false) // legacy, unused — see RecurringRule
  recurrence      RecurrenceType? // legacy, unused
  recurringRuleId String?
}

model SavingsBase {
  id     String @id @default(uuid())
  userId String @unique // one-to-one — always upsert, never insert a duplicate
  amount Float             // starting bank balance; running total = SavingsBase + cumulative net savings
}

enum RecurrenceType {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum RecurringKind {
  INCOME
  EXPENSE
}

model RecurringRule {
  id          String        @id @default(uuid())
  userId      String
  kind        RecurringKind
  accountId   String
  categoryId  String?
  frequency   RecurrenceType
  interval    Int            @default(1)
  startDate   DateTime
  endDate     DateTime?
  anchorDay   Int?
  nextRunDate DateTime       // read by the lazy catch-up engine
  lastRunDate DateTime?
  isActive    Boolean        @default(true)
  incomes       Income[]
  expenses      Expense[]
  notifications Notification[]
}

enum NotificationType {
  INCOME_CREDITED
  EXPENSE_DEBITED
}

model Notification {
  id              String           @id @default(uuid())
  userId          String
  recurringRuleId String?
  type            NotificationType
  isRead          Boolean          @default(false)
}
```

**Seeded default categories:**
Housing, Food & Dining, Transport, Utilities, Healthcare, Entertainment, Shopping, Education, Travel, Subscriptions, Personal Care, Other

---

## API Reference

Full request/response shapes live in each feature's `docs/features/<name>.md` — this table is a map of what's mounted where. All routes below require `authMiddleware` except the public `/api/auth/*` endpoints listed first.

### Auth — `/api/auth`

| Method | Path                  | Description                                                       |
| ------ | --------------------- | ----------------------------------------------------------------- |
| POST   | `/register`           | Register, hash password with bcrypt                               |
| POST   | `/activate`           | Activate account with a 5-digit code                              |
| POST   | `/resend`             | Resend activation code                                            |
| POST   | `/login`              | Verify credentials, open a `UserSession`, return JWT              |
| POST   | `/logout`             | Revoke the current session (requires auth — needs `req.user.sid`) |
| POST   | `/forgot-password`    | Request password reset                                            |
| GET    | `/verify-reset-token` | Validate a reset token without consuming it                       |
| POST   | `/reset-password`     | Validate token and update password                                |

### Income — `/api/income`, Expenses — `/api/expenses`

| Method | Path   | Description                                              |
| ------ | ------ | -------------------------------------------------------- |
| GET    | `/`    | List, filterable by query params                         |
| GET    | `/:id` | Get one                                                  |
| POST   | `/`    | Create — updates the linked account's balance atomically |
| PATCH  | `/:id` | Update                                                   |
| DELETE | `/:id` | Delete                                                   |

### Categories — `/api/categories`

| Method | Path   | Description                                           |
| ------ | ------ | ----------------------------------------------------- |
| GET    | `/`    | System defaults + the user's custom categories        |
| POST   | `/`    | Create a custom category                              |
| PATCH  | `/:id` | Update a user-created category                        |
| DELETE | `/:id` | Delete a user-created category (defaults are guarded) |

### Accounts — `/api/accounts`

| Method | Path       | Description                       |
| ------ | ---------- | --------------------------------- |
| GET    | `/summary` | Balances + `creditDebt` aggregate |
| GET    | `/`        | List the user's accounts          |
| POST   | `/`        | Create an account                 |
| PATCH  | `/:id`     | Update an account                 |
| DELETE | `/:id`     | Delete an account                 |

### Recurring — `/api/recurring`

| Method | Path       | Description                                |
| ------ | ---------- | ------------------------------------------ |
| POST   | `/catchup` | Manually trigger the lazy catch-up engine  |
| GET    | `/`        | List rules                                 |
| GET    | `/:id`     | Get one rule                               |
| POST   | `/`        | Create a rule                              |
| PATCH  | `/:id`     | Update a rule (also used for pause/resume) |
| DELETE | `/:id`     | Delete a rule                              |

### Notifications — `/api/notifications`

| Method | Path            | Description        |
| ------ | --------------- | ------------------ |
| GET    | `/`             | List, paginated    |
| GET    | `/unread-count` | Unread badge count |
| PATCH  | `/:id/read`     | Mark one as read   |
| POST   | `/read-all`     | Mark all as read   |
| DELETE | `/:id`          | Delete one         |

### Activity — `/api/activity`

| Method | Path      | Description                                        |
| ------ | --------- | -------------------------------------------------- |
| GET    | `/`       | Unified, filterable, paginated income+expense feed |
| GET    | `/export` | Excel export of the filtered feed                  |

### Dashboard — `/api/dashboard`

| Method | Path       | Description                               |
| ------ | ---------- | ----------------------------------------- |
| GET    | `/summary` | Balance/income/expense/savings stat tiles |
| GET    | `/trend`   | Cashflow trend chart data                 |

### Users — `/api/users`, Sessions — `/api/sessions`

| Method | Path                   | Description                                                   |
| ------ | ---------------------- | ------------------------------------------------------------- |
| GET    | `/users/me`            | Current profile                                               |
| PATCH  | `/users/me`            | Update profile fields                                         |
| POST   | `/users/...`           | Password change (re-verifies current password, see Auth Flow) |
| DELETE | `/users/...`           | Account deletion (re-verifies password)                       |
| GET    | `/sessions`            | List the user's active sessions                               |
| POST   | `/sessions/:id/revoke` | Revoke another session — 409 if it's the caller's current one |

---

## Deployment

| Resource | AWS                       | GCP            | Azure                   |
| -------- | ------------------------- | -------------- | ----------------------- |
| Frontend | Amplify / S3 + CloudFront | Cloud Run      | Static Web Apps         |
| Backend  | ECS Fargate               | Cloud Run      | Container Apps          |
| Database | RDS (PostgreSQL)          | Cloud SQL      | Azure DB for PostgreSQL |
| Secrets  | Secrets Manager           | Secret Manager | Key Vault               |

`SMTP_PASS` (and `SMTP_USER`) are secrets — store them in the platform's secret manager, not plain env vars in source control. `MAIL_FROM` must be on a domain verified with the SMTP provider (Resend/Brevo/SES/etc.) — an unverified sandbox sender (e.g. Resend's `onboarding@resend.dev`) only delivers to the provider account's own address, not to real users.

Backend ships as a Docker container — see `backend/Dockerfile`.

---

## Phase 2 — Investment P&L

Extend without restructuring:

- New Prisma models: `Portfolio`, `Holding`, `Transaction`
- New routes: `/api/investments/*`
- New feature folder: `frontend/features/investments/`
- New pages under `app/(private)/investments/` — automatically private via `proxy.ts`
