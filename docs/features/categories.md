# Categories

> Let users organise their expenses and income into named, colour-coded categories — with a curated set of defaults and the ability to create their own.

**Status:** Implemented  
**Route:** `/categories`  
**Last updated:** 2026-05-30

---

## Overview

Categories are the classification labels attached to expenses (and, in future, income entries). The app ships 14 seeded defaults (12 expense, 2 income) that every user sees but cannot modify. Users can supplement these with custom categories they own: create, rename, recolour, re-icon, and delete them. Categories cannot be deleted while expenses are still assigned to them.

---

## User Flows

- **Browse categories:** Navigate to `/categories`; switch between Expense and Income tabs to filter the card grid.
- **Create custom category:** Click "New category" or the dashed "Add" card; pick type, name, icon (24 options), and colour (12 swatches); live preview updates in real time.
- **Edit custom category:** Click the ⋯ menu on any user-owned card → Edit; form pre-fills with current values.
- **Delete custom category:** Click ⋯ → Delete; confirm in the dialog. If expenses are attached, a clear error message is shown and deletion is blocked.
- **Default categories (read-only):** No ⋯ menu is rendered on default cards — they cannot be edited or deleted from the UI or API.

---

## Frontend

**Route / Page**

| File                                                         | Role                                          |
| ------------------------------------------------------------ | --------------------------------------------- |
| `frontend/app/(private)/categories/page.tsx`                 | Route entry point — thin re-export            |
| `frontend/features/categories/components/CategoriesPage.tsx` | Main page component, owns all modal/tab state |

**Components**

| Component            | Responsibility                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CategoriesPage`     | Fetches category list; renders Expense/Income tab switcher, two sections (Default / My categories), loading skeleton, and three modals                                                       |
| `CategoryCard`       | Renders one category: coloured icon, name, "Default / Custom" label, colour accent bar at the bottom. Shows ⋯ dropdown (Edit / Delete) only for user-owned categories                        |
| `CategoryFormModal`  | Create and edit modal. Two-column layout on desktop: left live-preview pane (hero stamp, activity row, report legend); right form with type selector, name input, icon picker, colour picker |
| `DeleteConfirmModal` | Confirmation dialog with category name; displays `CONFLICT` error message inline if expenses are attached                                                                                    |

**Hooks**

| Hook                | Query key / Mutation | What it does                                                          |
| ------------------- | -------------------- | --------------------------------------------------------------------- |
| `useCategories`     | `['categories']`     | GET `/api/categories` — fetches defaults + user's own                 |
| `useCreateCategory` | mutation             | POST `/api/categories`; invalidates `['categories']` on success       |
| `useUpdateCategory` | mutation             | PATCH `/api/categories/:id`; invalidates `['categories']` on success  |
| `useDeleteCategory` | mutation             | DELETE `/api/categories/:id`; invalidates `['categories']` on success |

**Forms**

| Schema file                                     | Fields                            | Key validation rules                                                                                      |
| ----------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `features/categories/schemas/categorySchema.ts` | `name`, `type`, `icon?`, `color?` | `name` required, max 50 chars; `type` required (`EXPENSE \| INCOME`); `icon` and `color` optional strings |

**Constants** (`features/categories/constants.ts`)

| Export            | Value                                                   |
| ----------------- | ------------------------------------------------------- |
| `CATEGORY_ICONS`  | 24 PrimeIcon entries (`pi-home`, `pi-shopping-cart`, …) |
| `CATEGORY_COLORS` | 12 preset hex swatches (`#6366F1`, `#EC4899`, …)        |
| `DEFAULT_ICON`    | `'pi-tag'`                                              |
| `DEFAULT_COLOR`   | `'#6366F1'`                                             |
| `DEFAULT_TYPE`    | `'EXPENSE'`                                             |

---

## Backend

**Base path:** `/api/categories`

**Endpoints**

| Method   | Path                  | Auth     | Body                             | Success response                             |
| -------- | --------------------- | -------- | -------------------------------- | -------------------------------------------- |
| `GET`    | `/api/categories`     | Required | —                                | `{ success: true, data: Category[] }`        |
| `POST`   | `/api/categories`     | Required | `{ name, type?, icon?, color? }` | `{ success: true, data: Category }` 201      |
| `PATCH`  | `/api/categories/:id` | Required | `{ name, type?, icon?, color? }` | `{ success: true, data: Category }`          |
| `DELETE` | `/api/categories/:id` | Required | —                                | `{ success: true, data: { deleted: true } }` |

**Middleware chain**

```
authMiddleware → validate(createCategorySchema | updateCategorySchema) → controller → service
```

DELETE skips `validate` (no body to validate).

**Business rules**

- `userId` is always taken from `req.user.id` — never from the request body.
- `getAll` returns all `isDefault: true` categories (shared across all users) plus all categories where `userId = req.user.id`. Ordered: defaults first, then alphabetically by name.
- `create` always sets `isDefault: false` and `userId = req.user.id`. `type` defaults to `EXPENSE` in the service if omitted.
- `update` and `remove` check `isDefault` before checking ownership — a default category is rejected with `FORBIDDEN` before any ownership comparison.
- A category with attached expenses cannot be deleted; the service counts them first and throws `CONFLICT` with the count in the message.

**Error cases**

| Code               | HTTP | When                                                            |
| ------------------ | ---- | --------------------------------------------------------------- |
| `UNAUTHORIZED`     | 401  | Missing or invalid JWT                                          |
| `NOT_FOUND`        | 404  | No category with that ID                                        |
| `FORBIDDEN`        | 403  | Category is a default, or belongs to another user               |
| `CONFLICT`         | 409  | One or more expenses are assigned to the category being deleted |
| `VALIDATION_ERROR` | 400  | Request body fails Zod schema                                   |

---

## Data Model

```prisma
model Category {
  id        String       @id @default(uuid())
  userId    String?      // null = system default; set = user-owned (scoped to one user)
  name      String
  icon      String?      // PrimeIcon class name, e.g. 'pi-home'
  color     String?      // hex string, e.g. '#6366F1'
  type      CategoryType @default(EXPENSE)
  isDefault Boolean      @default(false)
  expenses  Expense[]
  user      User?        @relation(fields: [userId], references: [id])
}

enum CategoryType {
  EXPENSE
  INCOME
}
```

**Seeded defaults** (run `npx prisma db seed` from `backend/`):

| Name          | Type    | Icon             | Colour  |
| ------------- | ------- | ---------------- | ------- |
| Housing       | EXPENSE | pi-home          | #6366F1 |
| Food & Dining | EXPENSE | pi-shopping-cart | #F59E0B |
| Transport     | EXPENSE | pi-car           | #06B6D4 |
| Utilities     | EXPENSE | pi-bolt          | #475569 |
| Healthcare    | EXPENSE | pi-heart         | #10B981 |
| Entertainment | EXPENSE | pi-star          | #A855F7 |
| Shopping      | EXPENSE | pi-shopping-bag  | #EC4899 |
| Education     | EXPENSE | pi-book          | #14B8A6 |
| Travel        | EXPENSE | pi-globe         | #FF6363 |
| Subscriptions | EXPENSE | pi-refresh       | #8B5CF6 |
| Personal Care | EXPENSE | pi-user          | #84CC16 |
| Other         | EXPENSE | pi-tag           | #94A3B8 |
| Salary        | INCOME  | pi-briefcase     | #10B981 |
| Investment    | INCOME  | pi-chart-line    | #6366F1 |

---

## Dependencies

- **Auth** — all endpoints require a valid JWT; `userId` is scoped from `req.user.id`.
- **Expenses** — `Expense.categoryId` is a non-nullable FK referencing `Category.id` with `ON DELETE RESTRICT`. A category cannot be deleted while any expense references it.
- **`backend/src/utils/appError.ts`** — shared typed-error helper used by the service layer.

---

## Notes

- **Default category IDs are not UUIDs.** The seed uses each category's name as its `id` (e.g. `id: 'Housing'`) so the upsert `where: { id: name }` is idempotent. User-created categories get standard UUIDs.
- **Frontend Zod schema has no `.default()` on `type`.** Using `z.enum(...).default('EXPENSE')` caused a type conflict with react-hook-form's resolver. The default is instead set explicitly in `defaultValues` inside `CategoryFormModal`.
- **Backend Zod schema marks `type` as optional** — the service layer applies the `EXPENSE` default so existing callers that don't send `type` keep working.
- **`icon` and `color` null-safe fallbacks** exist in both `CategoryCard` and `CategoryFormModal` (`DEFAULT_ICON` and `DEFAULT_COLOR`) so categories created before these fields existed render correctly.
- The `INCOME` category type is stored but not yet consumed by the Income feature (Income records currently have no `categoryId`). The type field is forward-looking.
