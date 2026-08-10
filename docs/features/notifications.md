# Notifications

> See when a recurring rule (salary, rent, subscriptions, …) has automatically materialized into a real income or expense entry, with an unread badge and an infinite-scroll history.

**Status:** Implemented
**Route:** `/notifications`
**Last updated:** 2026-08-10

---

## Overview

The recurrence engine has no server-side scheduler — it materializes overdue occurrences lazily, on login/catch-up (see `docs/guides/recurring-cron.md`). That means a user's rent or salary can appear in their account balance without any action from them at that moment, potentially backdated if a catch-up run processes several missed occurrences at once. Notifications exist to surface that: every time the engine successfully materializes a rule's occurrence, it creates a `Notification` row alongside the income/expense row, so the user has a record of what happened and when — even if "when" (wall-clock) and the transaction's actual date don't match.

Notifications are **read-only from the user's side except for read/unread state** — there's no way to create one manually; they're a byproduct of the recurrence engine, not a first-class thing the user manages.

---

## User Flows

- **Unread badge:** `AppShell`'s sidebar shows a "Notifications" nav item and a floating badge, both driven by `useUnreadCount` — polled every 60s (`refetchInterval: 60_000`), and marked stale after 30s.
- **Browse history:** `/notifications` loads the first page (100 records) grouped into **Today / Yesterday / This Week / Older** sections (by `createdAt`, not read/unread) — scrolling near the bottom triggers `IntersectionObserver`-driven infinite scroll to fetch the next cursor page.
- **Read one:** Click a card → `NotificationDetailModal` opens and immediately fires `markAsRead` if it wasn't already read.
- **Mark all read:** Toolbar button, disabled when there are zero unread.

---

## Frontend

**Route / Page**

| File                                                      | Role                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `app/(private)/notifications/page.tsx`                    | Route entry point                                               |
| `features/notifications/components/NotificationsPage.tsx` | Main page: toolbar, grouped list, infinite scroll, detail modal |

**Components**

| Component                                                              | Responsibility                                                                            |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `NotificationsPage` (contains `NotificationCard`, not a separate file) | Renders one card per notification: icon, title, truncated body, relative time, unread dot |
| `NotificationDetailModal`                                              | Full title/body/timestamp; marks the notification read as a side effect of opening        |

**Hooks**

| Hook               | Query key / Mutation                    | What it does                                                                                                              |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `useNotifications` | `['notifications']`, `useInfiniteQuery` | Cursor-paginated fetch, `staleTime: 30_000`; `getNextPageParam` reads `nextCursor` from the last page                     |
| `useUnreadCount`   | `['notifications', 'unread-count']`     | `staleTime: 30_000`, `refetchInterval: 60_000` — the badge polls rather than pushing                                      |
| `useMarkAsRead`    | mutation                                | `PATCH /:id/read`, invalidates `['notifications']` (covers both the list and the unread count, since it's a prefix match) |
| `useMarkAllAsRead` | mutation                                | `POST /read-all`, same invalidation                                                                                       |

No `useDeleteNotification` hook exists on the frontend, even though the backend has a `DELETE /:id` endpoint — see Notes.

**Shared utilities** — `features/notifications/utils/notificationUtils.ts`:

- `resolveIcon(notification)` — prefers the linked `RecurringRule`'s category icon/color (inline styles) when present, falling back to a fixed per-`type` icon/Tailwind-class pair (`TYPE_CONFIG`) otherwise. This is why the API's `GET /` response includes the nested `recurringRule.category` relation.
- `getDateGroup` / `groupNotifications` — buckets into `GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older']`.
- `formatRelativeTime` / `formatDateTime` — both `dayjs`-based, per the project convention of never using native `Date` formatting.

**Forms:** none — this feature has no create/edit form, only read-state mutations.

---

## Backend

**Base path:** `/api/notifications`

**Endpoints**

| Method   | Path            | Auth     | Body / Query                                    | Success response                                                                         |
| -------- | --------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET`    | `/`             | Required | Query: `cursor?`, `limit?` (1–100, default 100) | `{ success: true, data: { notifications: Notification[], nextCursor: string \| null } }` |
| `GET`    | `/unread-count` | Required | —                                               | `{ success: true, data: { count: number } }`                                             |
| `PATCH`  | `/:id/read`     | Required | —                                               | `{ success: true, data: Notification }`                                                  |
| `POST`   | `/read-all`     | Required | —                                               | `{ success: true, data: { count: number } }`                                             |
| `DELETE` | `/:id`          | Required | —                                               | `{ success: true, data: null }`                                                          |

**Middleware chain**

```
authMiddleware → controller → service
```

`GET /` is a rare case of a query-param-validated GET: since `validate()` only reads `req.body`, the controller calls `z.string().optional().parse(req.query.cursor)` and `z.coerce.number()...parse(req.query.limit)` directly, per the project's stated pattern for GET query validation.

**Business rules**

- Cursor pagination: `take = limit + 1`; if more than `limit` rows come back, the extra row is dropped and its id becomes `nextCursor` — a standard "peek ahead" pagination technique, avoiding a separate `COUNT` query.
- Ownership checks use `findFirst({ where: { id, userId } })` (read) and `deleteMany({ where: { id, userId } })` (delete) — both return "not found" rather than a separate ownership check, per the project's Prisma ownership-check pattern.
- Notifications are created exclusively by `recurrenceEngine.ts`, inside the same flow that materializes a `RecurringRule` occurrence — never by a route in this feature. Creation is wrapped in try/catch and only logged on failure; a notification failing to write does not roll back or block the actual income/expense transaction it's describing.
- `createdAt` is set explicitly to the occurrence's date, not wall-clock time — see Notes.
- Notification `title`/`body` use `rule.note || rule.category?.name || <'Income'|'Expense'>` — `||`, not `??`, specifically to also fall through on an empty-string note.

**Error cases**

| Code               | HTTP | When                                                                                                                                      |
| ------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400  | `limit` outside 1–100                                                                                                                     |
| `UNAUTHORIZED`     | 401  | Missing or invalid JWT                                                                                                                    |
| `NOT_FOUND`        | 404  | Notification doesn't exist, or exists but belongs to another user (see Notes — the controller's JSDoc claims 403 here, the code does not) |

---

## Data Model

```prisma
enum NotificationType {
  INCOME_CREDITED
  EXPENSE_DEBITED
}

model Notification {
  id              String           @id @default(uuid())
  userId          String
  recurringRuleId String?
  type            NotificationType
  title           String
  body            String
  isRead          Boolean          @default(false)
  createdAt       DateTime         @default(now()) // overridden to occurrenceDate at creation — see Notes
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurringRule RecurringRule? @relation(fields: [recurringRuleId], references: [id], onDelete: SetNull)

  @@index([userId, isRead, createdAt(sort: Desc)])
}
```

`recurringRuleId` is nullable with `onDelete: SetNull` — deleting a `RecurringRule` doesn't delete its notification history, it just detaches it, so `resolveIcon` falls back to the generic type icon once that happens.

---

## Dependencies

- **Recurring** — the sole producer of notifications; see `backend/src/services/recurrenceEngine.ts`. This feature is purely a consumer/viewer of what that engine writes.
- **Categories** — `resolveIcon` reads the linked rule's category icon/color when present, via the `recurringRule.category` relation included in the `GET /` query.
- **Auth** — all endpoints require a valid JWT; `userId` is scoped from `req.user.id`.

---

## Notes

- **Backdated `createdAt`:** the recurrence engine sets `createdAt` to `occurrenceDate`, not the moment the row was actually written. A catch-up run that processes several missed weeks at once produces notifications dated across those weeks, not all "today" — this is intentional (see the code comment in `recurrenceEngine.ts`), but it means `createdAt` cannot be used to infer when the user was actually notified, only when the transaction it describes occurred.
- **No push mechanism:** the unread badge is polled (`refetchInterval: 60_000`), not pushed — a user won't see a new notification appear until the next poll or a manual refresh/navigation.
- **`DELETE /:id` exists on the backend with no frontend caller.** `notificationController.ts` and `notificationService.ts` both implement it, and `deleteNotification` on the service returns 404 correctly for both missing and other-user notifications — but no hook or UI element calls it. Either dead code to remove, or a "delete" action the UI is missing (there's a `pi-trash`-shaped gap next to "Mark all read").
- **JSDoc/code mismatch:** `markAsReadController`'s and `deleteNotificationController`'s doc comments both say "Returns 403 if the notification belongs to another user," but the underlying service functions (`findFirst`/`deleteMany` scoped by `userId`) can only ever produce `404 NOT_FOUND` for that case — they have no code path that returns `403`. The actual behavior (404) is correct per the project's ownership-check convention; the comments are stale and should be corrected if this file is touched again.
