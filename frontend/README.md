# Budget Tracker — Frontend

Next.js 16 App Router frontend for the Budget Tracker app. Handles authentication, income/expense tracking, category management, and financial summaries.

## Prerequisites

- Node.js 20+
- pnpm
- Backend API running on port 4000 (see `../backend/README.md`)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in the required values

# 3. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command             | Description                 |
| ------------------- | --------------------------- |
| `pnpm dev`          | Start development server    |
| `pnpm build`        | Build for production        |
| `pnpm start`        | Start production server     |
| `pnpm tsc --noEmit` | Type-check without building |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable              | Description                                | Example                  |
| --------------------- | ------------------------------------------ | ------------------------ |
| `NEXTAUTH_SECRET`     | Secret for signing NextAuth session tokens | Any strong random string |
| `NEXTAUTH_URL`        | Base URL of the frontend app               | `http://localhost:3000`  |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API                | `http://localhost:4000`  |

## Pages

| Route                | Description                               | Access  |
| -------------------- | ----------------------------------------- | ------- |
| `/`                  | Landing — redirects to login or dashboard | Public  |
| `/login`             | Sign in                                   | Public  |
| `/register`          | Create account                            | Public  |
| `/register/activate` | Enter activation code                     | Public  |
| `/forgot-password`   | Request password reset                    | Public  |
| `/reset-password`    | Set new password via token                | Public  |
| `/dashboard`         | Overview of income, expenses, and savings | Private |
| `/income`            | Manage income entries                     | Private |
| `/expenses`          | Manage expense entries                    | Private |
| `/categories`        | Manage expense categories                 | Private |
| `/summary`           | Monthly financial summary and charts      | Private |

Route guarding is handled in `proxy.ts` — unauthenticated users are redirected to `/login`.

## Tech Stack

| Layer         | Technology                |
| ------------- | ------------------------- |
| Framework     | Next.js 16 (App Router)   |
| Language      | TypeScript (strict mode)  |
| Styling       | Tailwind CSS v4           |
| Auth          | NextAuth.js v4            |
| Data fetching | Axios + TanStack Query v5 |
| Forms         | React Hook Form + Zod v4  |
| Charts        | Recharts                  |
| UI components | PrimeReact + PrimeIcons   |
| Theme         | next-themes (light/dark)  |
