# Auth

> Register, activate, log in, reset a forgotten password, and stay signed in across page loads — with per-device session tracking so a user can see and revoke their own active logins.

**Status:** Implemented
**Route:** `/login`, `/register`, `/register/activate`, `/register/confirm`, `/forgot-password`, `/reset-password`
**Last updated:** 2026-08-10

---

## Overview

Auth spans both apps: NextAuth on the frontend owns the browser session (an HTTP-only cookie holding a JWT), while the backend is the actual source of truth — it verifies credentials, issues the JWT, and tracks each login as a revocable `UserSession` row. A JWT alone isn't sufficient for a request to succeed; its `sid` claim must still point at a live, unrevoked session. This is what lets a user kill other devices' sessions from Settings without changing their password, and what lets sign-out invalidate a token immediately instead of waiting for it to expire.

Registration requires activation via a 5-digit code (emailed via Nodemailer/SMTP — see `services/emailService.ts` — with a `[DEV]` console fallback when `SMTP_HOST` is unset) before login is allowed.

---

## User Flows

- **Register:** Submits email/password/name → account created inactive, default `BANK` account created alongside it, activation code emailed → redirected to `/register/confirm` → enters the code at `/register/activate` (or requests a new one) → account activated → can now log in.
- **Log in:** NextAuth's credentials provider posts to the backend, which verifies the password and opens a new `UserSession` → JWT stored in an HTTP-only cookie → redirected to `/dashboard`.
- **Forgot password:** Submits email at `/forgot-password` → backend silently no-ops if the email doesn't exist (avoids leaking which emails are registered) → reset link emailed (send is fire-and-forget, so it adds no timing signal for the enumeration check) → `/reset-password?token=&email=` verifies the token, lets the user set a new password.
- **Sign out:** Revokes the current session server-side, then clears the NextAuth session — see `frontend/lib/logout.ts`, shared by `AppShell`'s sidebar button and Settings.
- **Session sync:** `<SessionTokenSync />` (mounted inside `SessionProvider`) publishes the access token into `frontend/lib/authToken.ts`'s module store, which `apiClient`'s request interceptor reads synchronously — this exists specifically so the interceptor never calls `getSession()` itself, which would fire a network request to `/api/auth/session` on every single API call.

---

## Frontend

**Pages**

| File                                    | Role                                              |
| --------------------------------------- | ------------------------------------------------- |
| `app/(auth)/login/page.tsx`             | Login                                             |
| `app/(auth)/register/page.tsx`          | Registration form                                 |
| `app/(auth)/register/confirm/page.tsx`  | "Check your email" interstitial after registering |
| `app/(auth)/register/activate/page.tsx` | Enter the 5-digit activation code                 |
| `app/(auth)/forgot-password/page.tsx`   | Request a reset link                              |
| `app/(auth)/reset-password/page.tsx`    | Set a new password from the emailed link          |
| `app/api/auth/[...nextauth]/route.ts`   | NextAuth route handler                            |

**Components**

| Component                                   | Responsibility                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `LoginPage` / `LoginForm`                   | Login form, calls `useLogin` (NextAuth `signIn('credentials', ...)`)     |
| `RegisterPage` / `RegisterForm`             | Registration form                                                        |
| `RegisterConfirmPage`                       | Static confirmation screen with a link into `/register/activate`         |
| `ActivateForm` / `ActivationCodeInput`      | 5-digit code entry; `ActivationCodeInput` is a dedicated segmented input |
| `ResendButton`                              | Requests a fresh activation code, cooldown-gated                         |
| `ForgotPasswordPage` / `ForgotPasswordForm` | Requests a reset link                                                    |
| `ResetPasswordPage` / `ResetPasswordForm`   | Sets a new password given `token` + `email` query params                 |

**Hooks**

| Hook                  | What it does                                                                         |
| --------------------- | ------------------------------------------------------------------------------------ |
| `useLogin`            | Wraps NextAuth `signIn('credentials', { redirect: false, ... })`, surfaces the error |
| `useRegister`         | `POST /api/auth/register`                                                            |
| `useActivate`         | `POST /api/auth/activate`                                                            |
| `useResendActivation` | `POST /api/auth/resend`                                                              |
| `useForgotPassword`   | `POST /api/auth/forgot-password`                                                     |
| `useResetPassword`    | `POST /api/auth/reset-password`                                                      |

None of these use TanStack Query for server state — auth actions are one-shot mutations, not cached reads, so they call `apiClient` directly and manage loading/error via component state.

**Forms**

| Schema file                       | Fields                                               | Key validation rules                                                               |
| --------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `schemas/registerSchema.ts`       | `email`, `password`, `name`, `firstName`, `lastName` | Password: 8+ chars, ≥1 letter, ≥1 digit, ≥1 special char (shared `passwordSchema`) |
| `schemas/loginSchema.ts`          | `email`, `password`                                  | Password only checked non-empty here — strength isn't re-validated on login        |
| `schemas/forgotPasswordSchema.ts` | `email`                                              | Valid email                                                                        |
| `schemas/resetPasswordSchema.ts`  | `email`, `token`, `password`                         | Same `passwordSchema` as registration                                              |

**Other auth-related frontend files** (outside `features/auth/`, but part of the auth surface):

| File               | Role                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/auth.ts`      | NextAuth config — credentials provider calls the backend, `jwt`/`session` callbacks shuttle `accessToken`/`id`/`name`/`firstName`/`lastName` onto the session; 7-day `maxAge` matches the backend JWT's `expiresIn` |
| `lib/authToken.ts` | Module-level access-token store, fed by `SessionTokenSync`; read synchronously by `apiClient`'s request interceptor                                                                                                 |
| `lib/logout.ts`    | Shared sign-out: revoke session server-side (best-effort) → NextAuth `signOut()`                                                                                                                                    |
| `proxy.ts`         | Route guard — redirects unauthenticated users away from private routes and authenticated users away from `/login`/`/register`                                                                                       |

---

## Backend

**Base path:** `/api/auth`

**Endpoints**

| Method | Path                  | Auth     | Body                                             | Success response                                                           |
| ------ | --------------------- | -------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `POST` | `/register`           | —        | `{ email, password, name, firstName, lastName }` | `{ success: true, data: { email } }`                                       |
| `POST` | `/activate`           | —        | `{ email, code }`                                | `{ success: true, data: { message } }`                                     |
| `POST` | `/resend`             | —        | `{ email }`                                      | `{ success: true, data: { email } }`                                       |
| `POST` | `/login`              | —        | `{ email, password }`                            | `{ success: true, data: { token, id, email, name, firstName, lastName } }` |
| `POST` | `/logout`             | Required | —                                                | `{ success: true, data: { ... } }` — revokes `req.user.sid`                |
| `POST` | `/forgot-password`    | —        | `{ email }`                                      | `{ success: true, data: {} }` — always succeeds, even for unknown emails   |
| `GET`  | `/verify-reset-token` | —        | Query: `email`, `token`                          | `{ success: true, data: { valid: true } }`                                 |
| `POST` | `/reset-password`     | —        | `{ email, token, password }`                     | `{ success: true, data: { message } }`                                     |

**Middleware chain**

```
validate(schema) → controller → service         # public endpoints
authMiddleware → controller → service            # /logout only
```

`/logout` is the one exception to "public `/api/auth/*`" — it needs `authMiddleware` to populate `req.user.sid`, the session it's revoking.

**Business rules**

- Registration creates the `User` row and a default `BANK` `Account` in one `$transaction` — a new user always has somewhere to record their first transaction.
- Login issues a fresh `UserSession` row per login (recording `User-Agent`) and signs a 7-day JWT carrying that session's id as `sid`. Every subsequent request's `authMiddleware` check depends on this row still existing and being unrevoked.
- Login returns `401 UNAUTHORIZED` for both "no such email" and "wrong password" — never reveals which one failed.
- Login returns `403 FORBIDDEN` (not 401) if the account exists but isn't activated yet — this isn't a credential problem, so it must not trigger the frontend's dead-token auto-logout.
- `forgotPassword` silently no-ops for an unknown email (same response either way) — prevents user enumeration via response timing/content.
- Reset tokens and activation codes both expire 15 minutes after issuance.
- Reset tokens are stored bcrypt-hashed, never in plaintext — `resetToken` in the DB is a hash, compared with `bcrypt.compare`.
- Activation/reset emails go through `services/emailService.ts` → `utils/emailTemplates.ts` (Handlebars templates in `src/templates/emails/`) → `lib/mailer.ts` (Nodemailer/SMTP). With no `SMTP_HOST` configured, `lib/mailer.ts` logs the message to the console with a `[DEV]` prefix instead.
- Email delivery failures are logged and never fail the request — the account/token already exists in the DB either way, and the user can retry via `resendActivation` or by re-submitting `forgotPassword`.

**Error cases**

| Code               | HTTP | When                                                                                                                                             |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VALIDATION_ERROR` | 400  | Bad request shape; also wrong/expired activation code or reset token                                                                             |
| `UNAUTHORIZED`     | 401  | Login: unknown email or wrong password. Also the general "missing/invalid/revoked session" case any `authMiddleware`-protected route can return. |
| `FORBIDDEN`        | 403  | Login attempted on an account that hasn't completed activation                                                                                   |
| `NOT_FOUND`        | 404  | Activate/resend for an email with no account                                                                                                     |
| `CONFLICT`         | 409  | Register with an already-registered email; resend for an already-active account                                                                  |

---

## Data Model

```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  passwordHash         String
  firstName            String
  lastName             String
  isActive             Boolean   @default(false)
  activationCode       String?
  activationCodeExpiry DateTime?
  resetToken           String?   // bcrypt hash, not the raw token
  resetTokenExpiry     DateTime?
  sessions             UserSession[]
}

model UserSession {
  id        String    @id @default(uuid())
  userId    String
  userAgent String?
  createdAt DateTime  @default(now())
  revokedAt DateTime? // null = active; set on logout or explicit revoke
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, revokedAt])
}
```

`UserSession` is the piece that makes sign-out and per-device revocation possible — a JWT by itself would otherwise stay valid until it expired, with no way to invalidate it early.

---

## Dependencies

- **Accounts** — registration creates a default account via `accountService.createDefault`, so account creation logic is a dependency of registration, not the reverse.
- **Settings** — the session list and per-session revoke UI (`GET /api/sessions`, `POST /api/sessions/:id/revoke`) live in the Settings feature, but operate on the `UserSession` rows this feature creates. See `docs/features/settings.md`.
- **Every other feature** — depends on this one: all protected routes require `authMiddleware`, and `req.user.id` scopes every query.

---

## Notes

- Real email is sent via Nodemailer over SMTP; the initial provider is Resend (free tier). Without a verified domain, Resend's sandbox sender (`onboarding@resend.dev`) only delivers to the Resend account's own address — a real multi-user deployment needs a domain verified with the provider (see `docs/ARCHITECTURE.md` → Deployment) and `MAIL_FROM` updated accordingly; no other code changes.
- Tokens issued before session tracking existed would carry no `sid` claim; `authMiddleware` treats a missing `sid` as an invalid token rather than risk an `undefined` lookup against the database.
- `User.name` (a single combined field) still exists alongside `firstName`/`lastName` and is set at registration time; treat it as legacy display data rather than adding new logic that depends on it.
