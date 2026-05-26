# Budget Tracker — Backend

Express.js REST API for the Budget Tracker app. Handles authentication, and will serve income, expense, category, and summary endpoints.

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 16 (Docker recommended — see docker-compose.yml in the repo root)

## Setup

```bash
# 1. Start the database (from repo root)
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env and fill in the required values

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed default categories
npx prisma db seed

# 6. Start the dev server
pnpm dev
```

The API will be available at [http://localhost:4000](http://localhost:4000).

## Scripts

| Command      | Description                              |
| ------------ | ---------------------------------------- |
| `pnpm dev`   | Start development server with hot reload |
| `pnpm build` | Compile TypeScript to `dist/`            |
| `pnpm start` | Start compiled production server         |

## Prisma Commands

Run these from the `backend/` directory:

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npx prisma migrate dev` | Apply pending migrations and regenerate client |
| `npx prisma generate`    | Regenerate Prisma client after schema changes  |
| `npx prisma db seed`     | Seed default expense categories                |
| `npx prisma studio`      | Open visual database browser at localhost:5555 |

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable       | Description                   | Example                                          |
| -------------- | ----------------------------- | ------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string  | `postgresql://user:pass@localhost:5432/budgetdb` |
| `JWT_SECRET`   | Secret for signing JWT tokens | Any strong random string                         |
| `PORT`         | Port the API listens on       | `4000`                                           |
| `NODE_ENV`     | Runtime environment           | `development`                                    |
| `FRONTEND_URL` | Frontend origin (for CORS)    | `http://localhost:3000`                          |

## API Endpoints

All responses follow a consistent envelope format:

```json
// Success
{ "success": true, "data": <payload> }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

### Auth — `/api/auth`

| Method | Path                           | Description                        | Auth required |
| ------ | ------------------------------ | ---------------------------------- | ------------- |
| `POST` | `/api/auth/register`           | Create a new account               | No            |
| `POST` | `/api/auth/activate`           | Activate account with code         | No            |
| `POST` | `/api/auth/resend`             | Resend activation code             | No            |
| `POST` | `/api/auth/login`              | Sign in and receive JWT            | No            |
| `POST` | `/api/auth/forgot-password`    | Request password reset email       | No            |
| `GET`  | `/api/auth/verify-reset-token` | Validate a password reset token    | No            |
| `POST` | `/api/auth/reset-password`     | Set a new password via reset token | No            |

### Standard Error Codes

| Code               | HTTP Status | Meaning                                            |
| ------------------ | ----------- | -------------------------------------------------- |
| `VALIDATION_ERROR` | 400         | Invalid request body or query params               |
| `UNAUTHORIZED`     | 401         | Missing or invalid JWT                             |
| `FORBIDDEN`        | 403         | Authenticated but not allowed                      |
| `NOT_FOUND`        | 404         | Resource does not exist                            |
| `CONFLICT`         | 409         | Duplicate resource (e.g. email already registered) |
| `INTERNAL_ERROR`   | 500         | Unexpected server error                            |

## Database Models

| Model         | Description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| `User`        | Registered user with email, hashed password, and activation state                |
| `Income`      | Income entry scoped to a user, month, and year                                   |
| `Expense`     | Expense entry linked to a user and category; supports recurring monthly expenses |
| `Category`    | Expense category — either a system default (`userId: null`) or user-created      |
| `SavingsBase` | One-to-one with User; stores the user's starting bank balance                    |

## Tech Stack

| Layer      | Technology                  |
| ---------- | --------------------------- |
| Runtime    | Node.js 20                  |
| Framework  | Express.js                  |
| Language   | TypeScript (strict mode)    |
| ORM        | Prisma                      |
| Database   | PostgreSQL 16               |
| Auth       | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod v3                      |
