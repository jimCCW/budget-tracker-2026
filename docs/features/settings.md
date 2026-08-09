# Settings

> Let users view and edit their profile, change their password, see and revoke active login sessions, view their (currently fixed) currency and language, and permanently delete their account.

**Status:** Implemented
**Route:** `/settings`
**Last updated:** 2026-08-09

---

## Overview

Settings is the account-management hub, reachable from `AppShell`'s desktop sidebar footer and mobile bottom nav (both previously unwired stubs — the sidebar also had a separate, still-unwired "Profile" stub, which has since been removed rather than left dangling). It covers five areas, each a full-width card: personal info (first/last/full name + read-only email), security (password change + active session list), currency & region (read-only display), sign out, and a "Danger zone" for account deletion.

The security section introduces real session tracking: every login opens a `UserSession` row, the issued JWT carries that session's id (`sid`), and `authMiddleware` checks on every request that the session hasn't been revoked. This is a genuine shift from pure stateless JWT auth — revoking a session from Settings immediately invalidates that device's token rather than just hiding it from a list.

---

## User Flows

- **Edit name:** User edits First name, Last name, and/or Full name in the Personal Info card and saves → `PATCH /api/users/me` updates `firstName`, `lastName`, and `name` independently (the three are not derived from each other — `name` is a free-text display name, `firstName`/`lastName` drive `AppShell`'s avatar initials) → the NextAuth session is refreshed client-side via `useSession().update()` so `AppShell`'s sidebar name/initials update without a re-login. Email is read-only.
- **Change password:** "Change" button opens `ChangePasswordModal` → current + new + confirm password → `POST /api/users/change-password` bcrypt-verifies the current password server-side before hashing and storing the new one → on success the client calls the shared `logout()` helper, forcing a fresh login with the new password (this device's session is explicitly revoked, not just left to linger). A wrong current password shows the error banner and leaves the modal open — see the `FORBIDDEN`-not-`UNAUTHORIZED` note below for why that doesn't also force a logout.
- **View active sessions:** Security section lists every non-revoked session for the user (device label parsed from the `User-Agent` recorded at login, relative "signed in X ago" time), with the current device tagged "Current".
- **Revoke a session:** "Revoke" button (shown only on non-current sessions) calls `POST /api/sessions/:id/revoke` → that session's `revokedAt` is set → the next request made with that device's JWT gets 401 `UNAUTHORIZED` ("Session has been revoked") from `authMiddleware`, effectively force-logging it out. Revoking your own current session through this endpoint is rejected (409) — sign out instead.
- **Sign out:** Settings page and `AppShell`'s sidebar both call a shared `logout()` helper — best-effort `POST /api/auth/logout` (revokes the current session) followed by NextAuth `signOut()`. This keeps a signed-out device from lingering as "active" in the session list.
- **View currency & region:** Read-only rows showing `currency` ("SGD") and `language` ("English") from the user's profile — no picker, since only one value is supported per field today.
- **Delete account:** "Delete account" button in the Danger Zone card opens `DeleteAccountModal`, which requires re-entering the current password (not a bare one-click delete, unlike the original design mockup) → `DELETE /api/users/me` bcrypt-verifies the password, then transactionally deletes every row the user owns — incomes, expenses, recurring rules, accounts, custom categories, savings base — before deleting the `User` row itself (which cascades `Notification` and `UserSession` automatically) → on success the client calls NextAuth `signOut()` directly (not the shared `logout()` helper, since the account and its sessions are already gone by that point).

---

## Frontend

**Route / Page**

| File                                            | Role                                          |
| ----------------------------------------------- | --------------------------------------------- |
| `app/(private)/settings/page.tsx`               | Route entry point (re-exports `SettingsPage`) |
| `features/settings/components/SettingsPage.tsx` | Main page — composes all sections             |

**Components**

| Component               | Responsibility                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `PersonalInfoCard`      | Editable first name, last name, and full name fields + read-only email; save triggers profile update + session refresh          |
| `SecuritySection`       | Password-change trigger + active sessions list with revoke                                                                      |
| `ChangePasswordModal`   | Current/new/confirm password form (reuses `components/ui/Modal.tsx` + the `Password`/`Controller` pattern from `features/auth`) |
| `CurrencyRegionSection` | Read-only currency/language display                                                                                             |
| `SignOutCard`           | Sign-out button (shared `logout()` helper)                                                                                      |
| `DeleteAccountCard`     | Red "Danger zone" card; opens `DeleteAccountModal`                                                                              |
| `DeleteAccountModal`    | Password re-entry confirmation before permanent deletion; signs out directly on success                                         |

**Hooks**

| Hook                | Query key      | What it does                                                                  |
| ------------------- | -------------- | ----------------------------------------------------------------------------- |
| `useProfile`        | `['user']`     | `GET /api/users/me`                                                           |
| `useUpdateProfile`  | —              | `PATCH /api/users/me`; invalidates `['user']`; refreshes the NextAuth session |
| `useChangePassword` | —              | `POST /api/users/change-password`                                             |
| `useSessions`       | `['sessions']` | `GET /api/sessions`                                                           |
| `useRevokeSession`  | —              | `POST /api/sessions/:id/revoke`; invalidates `['sessions']`                   |
| `useDeleteAccount`  | —              | `DELETE /api/users/me` with `{ data: values }` (axios DELETE-with-body)       |

**Forms**

| Schema file                                         | Fields                                           | Key validation                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `features/settings/schemas/updateProfileSchema.ts`  | `firstName`, `lastName`, `name`                  | `firstName`/`lastName` required; `name` trimmed, required, max 80 chars — all three independently editable, not derived from each other |
| `features/settings/schemas/changePasswordSchema.ts` | `currentPassword`, `password`, `confirmPassword` | Reuses `features/auth/schemas/passwordSchema`; `password === confirmPassword` via `.refine`                                             |
| `features/settings/schemas/deleteAccountSchema.ts`  | `password`                                       | Required, non-empty                                                                                                                     |

**Shared, non-feature files touched**

- `components/AppShell.tsx` — desktop `FOOTER_ITEMS` now has only the "Settings" entry (`href: '/settings'`) — the separate "Profile" stub was removed rather than left dangling. The mobile "Profile" tab was repointed to `/settings` and relabeled "Settings" (closes a pre-existing gap: mobile had no reachable settings/profile page and no way to sign out at all). Sidebar sign-out button now calls the shared `logout()` helper instead of `signOut()` directly.
- `lib/auth.ts` — `jwt` callback gained a `trigger === 'update'` branch that merges `name`/`firstName`/`lastName` from `useSession().update(...)` calls into the token. No other code in the repo used NextAuth's session-update flow before this.
- `lib/logout.ts` — new shared helper: best-effort `POST /api/auth/logout` then NextAuth `signOut({ callbackUrl: '/login' })`. Used by both `AppShell` and `SignOutCard`.

---

## Backend

**Base paths:** `/api/users`, `/api/sessions`, plus one addition to `/api/auth`

**Endpoints**

| Method   | Path                         | Auth     | Body / Schema          | Success response                               |
| -------- | ---------------------------- | -------- | ---------------------- | ---------------------------------------------- |
| `GET`    | `/api/users/me`              | Required | —                      | `{ success: true, data: UserProfile }`         |
| `PATCH`  | `/api/users/me`              | Required | `updateProfileSchema`  | `{ success: true, data: UserProfile }`         |
| `POST`   | `/api/users/change-password` | Required | `changePasswordSchema` | `{ success: true, data: { message: string } }` |
| `GET`    | `/api/sessions`              | Required | —                      | `{ success: true, data: Session[] }`           |
| `POST`   | `/api/sessions/:id/revoke`   | Required | —                      | `{ success: true, data: { revoked: true } }`   |
| `POST`   | `/api/auth/logout`           | Required | —                      | `{ success: true, data: { message: string } }` |
| `DELETE` | `/api/users/me`              | Required | `deleteAccountSchema`  | `{ success: true, data: { deleted: true } }`   |

`UserProfile` = `{ id, email, name, firstName, lastName, currency, language, createdAt }` (never includes `passwordHash` or tokens — enforced via an explicit Prisma `select`).

**Middleware chain**

```
authMiddleware → validate(schema) → controller
```

`GET /api/sessions` and the two `/revoke`/`/logout` POSTs skip `validate` (no body).

**Business rules**

- `req.user.id` scopes every lookup — never trusted from the request body.
- `updateProfile` writes `firstName`, `lastName`, and `name` exactly as submitted — none is derived from the others. (An earlier iteration derived `name` from `firstName + lastName`; that was replaced once the UI needed all three independently editable.)
- `changePassword` and `deleteAccount` bcrypt-verify the submitted password and throw `FORBIDDEN` (403) — deliberately **not** `UNAUTHORIZED`/401 — on mismatch. `frontend/lib/api.ts`'s response interceptor force-signs-out the user on _any_ 401 (to drop a backend JWT that outlived its NextAuth session); a wrong-password attempt on these endpoints is a business-logic failure, not a dead token, so it must not collide with that 401 codepath or a mistyped password would silently log the user out instead of just showing an error.
- `revokeSession` is ownership-scoped (`userId` + session `id`) and refuses to revoke the caller's own current session (`CONFLICT` 409) — that's what sign-out is for.
- `authService.login` now creates a `UserSession` row per login (recording the `User-Agent` header) and signs the JWT with that session's id as `sid`.
- `authMiddleware` is now **async**: after verifying the JWT it does one indexed `UserSession.findUnique` lookup and rejects with 401 (`Session has been revoked`) if the session is missing or `revokedAt` is set. This runs on every authenticated request across the whole app, not just Settings routes. Tokens with no `sid` claim (issued before this shipped) and any transient error from the session lookup are both treated as `Invalid token` (401) rather than propagating — Express 4 does not catch rejections thrown by async middleware, and an uncaught one here would crash the whole process, not just fail the one request.
- `authService.logout(sessionId)` revokes the session tied to the caller's own JWT; idempotent (`updateMany` with `revokedAt: null` in the `where` clause).
- `deleteAccount` bcrypt-verifies the password, then in one `$transaction` deletes `Income`, `Expense`, `RecurringRule`, `Account`, `Category` (scoped to this `userId`, so system-default categories with `userId: null` are untouched), and `SavingsBase` — in that order, since Prisma defaults required relations to `RESTRICT` rather than `CASCADE`, and rows that reference accounts/categories/recurring rules must go first — before deleting the `User` row itself. `Notification` and `UserSession` cascade automatically via their `onDelete: Cascade` FK to `User`.

**Device labeling (`backend/src/utils/userAgent.ts`)**

`describeUserAgent(userAgent)` — simple substring matching (Chrome/Firefox/Safari/Edge × iPhone/iPad/Android/Mac/Windows/Linux) to produce labels like `"Chrome · Windows"`. No UA-parsing dependency. Falls back to `"Browser"` / `"Unknown device"` when nothing matches.

**Error cases**

| Code               | HTTP | When                                                        |
| ------------------ | ---- | ----------------------------------------------------------- |
| `UNAUTHORIZED`     | 401  | Missing/invalid JWT; JWT's session revoked                  |
| `FORBIDDEN`        | 403  | Wrong current password on change-password or delete-account |
| `NOT_FOUND`        | 404  | User no longer exists; session id not found/owned           |
| `VALIDATION_ERROR` | 400  | Bad request body, incl. `password !== confirmPassword`      |
| `CONFLICT`         | 409  | Attempting to revoke your own current session               |

---

## Data Model

```prisma
model User {
  // ...existing fields...
  currency  String        @default("SGD")
  language  String        @default("English")
  sessions  UserSession[]
}

model UserSession {
  id        String    @id @default(uuid())
  userId    String
  userAgent String?
  createdAt DateTime  @default(now())
  revokedAt DateTime?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, revokedAt])
}
```

`currency`/`language` both use a plain DB `DEFAULT` (no nullable→backfill→NOT NULL dance needed, since the default is a fixed literal rather than derived per-row). `UserSession` rows are never deleted or cleaned up — they accumulate indefinitely; there's no retention/cleanup job.

Migration: `20260809000000_add_user_currency_language_and_sessions`.

---

## Dependencies

- **Auth** — this feature _extends_ the auth system itself (session tracking, JWT `sid` claim, async `authMiddleware`) rather than just depending on it; every other authenticated feature in the app is affected by the added per-request session-revocation check.
- **AppShell** — nav entries point here; the shared sign-out path now lives in `lib/logout.ts` and is used by both.

---

## Notes

- Built from a claude.ai/design mockup ("Budget Tracking App" project, imported via the design MCP) used as visual/structural reference only — reimplemented with this repo's PrimeReact + Tailwind conventions, not the mockup's raw inline-style React.
- Deliberately **not** built in this pass: biometric login, 2FA, notification preferences, multi-currency/multi-language (only one value each is supported — the UI shows a checkmark row, not a picker), date format / week-start, and an "Account" quick-links section to the already-separate Accounts/Recurring/Categories pages.
- Delete-account was added after an initial pass that deliberately left it out — see the git history for the earlier "coming soon"-style scoping discussion. It diverges from the design mockup's bare single-click button: a password re-entry step was added given how destructive and irreversible the action is.
- All Settings cards render full-width (no `max-w-*` constraint on the page's content wrapper), unlike the initial implementation which capped the column at `max-w-2xl`.
- "Location" per session (city/country) was deliberately dropped from the original design — it would require a geo-IP dependency or third-party lookup. Only a device label and relative sign-in time are shown.
- The added authMiddleware DB lookup is a real (if small) latency/complexity trade-off across the whole API surface — see the Security section's design intent in `docs/features/settings.md` (this file) if reconsidering a fully stateless-JWT alternative later.
