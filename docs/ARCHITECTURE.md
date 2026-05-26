# Architecture — Budget Tracker

## Overview

Separate frontend and backend so each can scale and deploy independently.
Future expansion: investment P&L tracking (Phase 2).

## Stack Decisions

| Layer              | Choice                  | Reason                                                               |
| ------------------ | ----------------------- | -------------------------------------------------------------------- |
| Frontend framework | Next.js App Router      | File-based routing, server components, easy auth integration         |
| Styling            | Tailwind CSS            | Utility-first, no context switching                                  |
| Data fetching      | Axios + TanStack Query  | Axios for typed HTTP client; TanStack Query for caching and mutations|
| Forms              | react-hook-form + Zod   | Type-safe validation, single schema reused on FE and BE              |
| Charts             | Recharts                | React-native, composable, no build step                              |
| Auth               | NextAuth.js + JWT       | Native Next.js integration; backend validates token independently    |
| Backend            | Express.js + TypeScript | Lightweight, familiar, easy to extend                                |
| ORM                | Prisma                  | Type-safe queries, auto migrations, great TypeScript DX              |
| Database           | PostgreSQL              | Relational model fits budgeting data; strong managed cloud options   |
| Validation         | Zod                     | Shared schemas between frontend forms and backend request validation |

---

## Route Access

| Route         | Access                |
| ------------- | --------------------- |
| `/`           | Public — landing page |
| `/login`           | Public                |
| `/register`        | Public                |
| `/forgot-password` | Public                |
| `/reset-password`  | Public                |
| `/dashboard`  | Private               |
| `/income`     | Private               |
| `/expenses`   | Private               |
| `/categories` | Private               |
| `/summary`    | Private               |

### Middleware Implementation (`frontend/proxy.ts`)

Uses NextAuth `getToken` to read the session cookie server-side. Runs on the Edge before any page renders — no client-side flicker. File is named `proxy.ts` (Next.js 16+) and exports `proxy`, not `middleware`.

```ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', req.url));
  }

  const isPublic = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

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

## Frontend — Feature-based Structure

```
frontend/
├── app/
│   ├── page.tsx                  # Landing page (public)
│   ├── (auth)/
│   │   ├── login/                # Public
│   │   └── register/             # Public
│   └── (private)/                # Private — all guarded by middleware
│       ├── dashboard/
│       ├── income/
│       ├── expenses/
│       ├── categories/
│       └── summary/
├── features/
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   ├── hooks/                # useLogin, useRegister
│   │   └── schemas/
│   ├── income/
│   │   ├── components/           # IncomeForm, IncomeList, IncomeItem
│   │   ├── hooks/                # useIncome, useAddIncome
│   │   └── schemas/
│   ├── expenses/
│   │   ├── components/           # ExpenseForm, ExpenseList, ExpenseItem
│   │   ├── hooks/                # useExpenses, useAddExpense
│   │   └── schemas/
│   ├── categories/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── schemas/
│   └── summary/
│       ├── components/           # MonthlyChart, SavingsSummary
│       └── hooks/
├── components/
│   ├── ui/                       # Button, Input, Select, Modal, Badge
│   └── charts/                   # Generic Recharts wrappers
├── lib/
│   ├── api.ts
│   └── auth.ts
├── types/
└── middleware.ts
```

---

## Backend — Layer Structure

```
backend/
├── src/
│   ├── routes/          # Express routers — wire path to middleware chain + controller
│   ├── middleware/
│   │   ├── authMiddleware.ts    # Validates JWT, sets req.user
│   │   ├── validate.ts          # validate(zodSchema) — reusable request body validator
│   │   └── errorHandler.ts     # Global error handler → standard response format
│   ├── controllers/     # Request/response only — calls service, returns response
│   ├── services/        # All business logic lives here
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── Dockerfile
```

### Middleware Chain

Every protected route follows this order:

```
authMiddleware → validate(zodSchema) → controller
```

`validate` is a reusable middleware factory that accepts a Zod schema, parses `req.body`, and either passes validated data forward or returns a `VALIDATION_ERROR` response immediately. The controller receives only pre-validated, typed input.

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
{ success:false, error: { code: string, message: string } }
```

| Code               | HTTP | When                                 |
| ------------------ | ---- | ------------------------------------ |
| `VALIDATION_ERROR` | 400  | Invalid request body or query params |
| `UNAUTHORIZED`     | 401  | Missing or invalid JWT               |
| `FORBIDDEN`        | 403  | Authenticated but not allowed        |
| `NOT_FOUND`        | 404  | Resource does not exist              |
| `CONFLICT`         | 409  | Duplicate resource                   |
| `INTERNAL_ERROR`   | 500  | Unexpected server error              |

---

## Database Schema

```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  passwordHash         String
  name                 String?
  isActive             Boolean   @default(false)
  activationCode       String?
  activationCodeExpiry DateTime?
  resetToken           String?
  resetTokenExpiry     DateTime?
  createdAt            DateTime  @default(now())
  incomes      Income[]
  expenses     Expense[]
  categories   Category[]
  savingsBase  SavingsBase?
}

model Income {
  id        String   @id @default(uuid())
  userId    String
  amount    Float
  month     Int      // 1–12
  year      Int
  note      String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Category {
  id        String    @id @default(uuid())
  userId    String?   // null = system default
  name      String
  icon      String?
  isDefault Boolean   @default(false)
  expenses  Expense[]
  user      User?     @relation(fields: [userId], references: [id])
}

model Expense {
  id          String          @id @default(uuid())
  userId      String
  categoryId  String
  amount      Float
  description String?
  date        DateTime
  isRecurring Boolean         @default(false)
  recurrence  RecurrenceType?
  createdAt   DateTime        @default(now())
  user        User            @relation(fields: [userId], references: [id])
  category    Category        @relation(fields: [categoryId], references: [id])
}

model SavingsBase {
  id        String   @id @default(uuid())
  userId    String   @unique
  amount    Float
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
}

enum RecurrenceType {
  MONTHLY
}
```

**Seeded default categories:**
Housing, Food & Dining, Transport, Utilities, Healthcare, Entertainment, Shopping, Education, Travel, Subscriptions, Personal Care, Other

---

## API Reference

### Auth

| Method | Path                              | Description                                        |
| ------ | --------------------------------- | -------------------------------------------------- |
| POST   | `/api/auth/register`              | Register, hash password with bcrypt                |
| POST   | `/api/auth/activate`              | Activate account with 5-digit code                 |
| POST   | `/api/auth/resend`                | Resend activation code                             |
| POST   | `/api/auth/login`                 | Verify credentials, return JWT                     |
| POST   | `/api/auth/forgot-password`       | Request password reset (logs link to console in dev) |
| GET    | `/api/auth/verify-reset-token`    | Validate reset token without consuming it          |
| POST   | `/api/auth/reset-password`        | Validate token and update password                 |

### Income

| Method | Path                       | Description                    |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/api/income?month=&year=` | Get income entries for a month |
| POST   | `/api/income`              | Add income entry               |
| PUT    | `/api/income/:id`          | Update income entry            |
| DELETE | `/api/income/:id`          | Delete income entry            |

### Expenses

| Method | Path                         | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/api/expenses?month=&year=` | Get expenses for a month |
| POST   | `/api/expenses`              | Add an expense           |
| PUT    | `/api/expenses/:id`          | Update an expense        |
| DELETE | `/api/expenses/:id`          | Delete an expense        |

### Categories

| Method | Path                  | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/api/categories`     | Get system defaults + user's custom categories |
| POST   | `/api/categories`     | Create a custom category                       |
| DELETE | `/api/categories/:id` | Delete a user-created category (not defaults)  |

### Summary

| Method | Path                   | Description                               |
| ------ | ---------------------- | ----------------------------------------- |
| GET    | `/api/summary?year=`   | Monthly income / expenses / net per month |
| GET    | `/api/summary/balance` | SavingsBase + cumulative running total    |

---

## Deployment

| Resource | AWS                       | GCP            | Azure                   |
| -------- | ------------------------- | -------------- | ----------------------- |
| Frontend | Amplify / S3 + CloudFront | Cloud Run      | Static Web Apps         |
| Backend  | ECS Fargate               | Cloud Run      | Container Apps          |
| Database | RDS (PostgreSQL)          | Cloud SQL      | Azure DB for PostgreSQL |
| Secrets  | Secrets Manager           | Secret Manager | Key Vault               |

Backend ships as a Docker container — see `backend/Dockerfile`.

---

## Phase 2 — Investment P&L

Extend without restructuring:

- New Prisma models: `Portfolio`, `Holding`, `Transaction`
- New routes: `/api/investments/*`
- New feature folder: `frontend/features/investments/`
- New pages under `app/(private)/investments/` — automatically private via middleware
