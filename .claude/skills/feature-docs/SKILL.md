---
name: feature-docs
description: >
  Generates or updates a structured markdown documentation file for a feature
  in this project. Stores docs under docs/features/<name>.md and keeps
  docs/INDEX.md in sync. ALWAYS invoke this skill when the user says anything
  like: "document the X feature", "write docs for X", "update the docs for X",
  "create feature docs", "generate feature documentation", "/feature-docs X",
  or any phrasing asking to create or update documentation for a specific app
  feature. Also invoke when the user provides a specific .md file path and asks
  to check or update the documentation at that location.
---

# Feature Docs Workflow

Three phases: **resolve target → explore codebase → write or update doc → sync INDEX.md**.

---

## Phase 1: Resolve Target

### 1a. Determine the feature name

Extract the feature name from the user's message. Normalize to lowercase kebab-case.

Recognized features in this project:
`auth`, `accounts`, `dashboard`, `categories`, `expenses`, `income`, `summary`, `transactions`, `settings`, `profile`, `notifications`, `recurring`

If no feature name is clear, ask:

> "Which feature should I document? (e.g. `accounts`, `auth`, `categories`)"

Wait for the answer before continuing.

### 1b. Determine the target file path

Default path: `docs/features/<name>.md` relative to the repo root
(`/Volumes/Jimmy_Disc1/Docs/Personal/Code/claude-budget-tracking/docs/features/<name>.md`)

If the user explicitly provided a file path, use that path instead.

### 1c. Check for existing doc

Attempt to read the target file.

- **File exists** → you are **updating**. Read its full content now. You will preserve accurate sections and overwrite only what has changed.
- **File does not exist** → you are **creating**. You will write it from scratch using the template in Phase 3.

Tell the user:

> `Documenting feature: <name>. Target: docs/features/<name>.md (<create|update>)`

---

## Phase 2: Explore the Codebase

Read all relevant files **before writing a single line of documentation**. Do not infer or guess — accuracy depends on reading the actual code. Run as many reads in parallel as possible.

**Frontend** (adapt paths to the feature name):

- `frontend/features/<name>/components/` — read every component file
- `frontend/features/<name>/hooks/` — read every hook file
- `frontend/features/<name>/schemas/` — read every schema file
- `frontend/features/<name>/constants.ts` — if it exists
- `frontend/types/<name>.ts` or any type file referenced by the feature components
- `frontend/app/(private)/<name>/page.tsx` or `frontend/app/(auth)/<name>/page.tsx` — the page entry point

**Backend**:

- `backend/src/routes/<name>Routes.ts`
- `backend/src/controllers/<name>Controller.ts`
- `backend/src/services/<name>Service.ts`
- `backend/src/schemas/<name>Schemas.ts`

**Shared**:

- `backend/prisma/schema.prisma` — read in full; extract only the models relevant to this feature
- `backend/src/index.ts` — find the route registration line to confirm the base URL path (e.g. `/api/accounts`)

After reading, identify:

- Which components are presentational vs contain business logic
- Which hooks use TanStack Query (server state) vs local `useState`
- What Zod schemas define the form shapes and their validation rules
- What business rules the service layer enforces (ownership checks, guards, derived values)
- What Prisma models and fields are used (including enums, nullable fields, defaults)
- Which other features this one depends on

If a file doesn't exist (e.g. the feature is not yet implemented), note that in the doc rather than skipping the section.

---

## Phase 3: Write or Update the Doc

### If creating — use this template exactly

````markdown
# <Feature Display Name>

> <One-sentence user-facing purpose — what does this feature let the user do?>

**Status:** <Implemented | Partial | Planned>
**Route:** `/<route-path>`
**Last updated:** <YYYY-MM-DD>

---

## Overview

<2–4 sentences. What problem does this feature solve? What can the user do with it? Write for a developer new to the project — avoid internal shorthand.>

---

## User Flows

- **<Flow name>:** <What the user does and what happens — one line each>
- **<Flow name>:** ...

---

## Frontend

**Route / Page**

| File                                        | Role                |
| ------------------------------------------- | ------------------- |
| `app/(private)/<name>/page.tsx`             | Route entry point   |
| `features/<name>/components/<Name>Page.tsx` | Main page component |

**Components**

| Component         | Responsibility                  |
| ----------------- | ------------------------------- |
| `<ComponentName>` | <What it renders and key props> |

**Hooks**

| Hook     | Query key / Mutation | What it does                   |
| -------- | -------------------- | ------------------------------ |
| `use<X>` | `['<key>']`          | <Fetches or mutates what data> |

**Forms**

| Schema file               | Fields              | Key validation rules              |
| ------------------------- | ------------------- | --------------------------------- |
| `schemas/<name>Schema.ts` | `name`, `type`, ... | <e.g. name required, balance ≥ 0> |

---

## Backend

**Base path:** `/api/<name>`

**Endpoints**

| Method   | Path              | Auth     | Body / Query       | Success response                             |
| -------- | ----------------- | -------- | ------------------ | -------------------------------------------- |
| `GET`    | `/api/<name>`     | Required | —                  | `{ success: true, data: <Type>[] }`          |
| `POST`   | `/api/<name>`     | Required | `{ field: type }`  | `{ success: true, data: <Type> }` 201        |
| `PATCH`  | `/api/<name>/:id` | Required | `{ field?: type }` | `{ success: true, data: <Type> }`            |
| `DELETE` | `/api/<name>/:id` | Required | —                  | `{ success: true, data: { deleted: true } }` |

**Middleware chain**

```
authMiddleware → validate(schema) → controller → service
```

**Business rules**

- <Rule — e.g. "userId is always taken from req.user.id, never from the request body">
- <Rule — e.g. "cannot delete the last remaining account (CONFLICT 409)">

**Error cases**

| Code           | HTTP | When                                           |
| -------------- | ---- | ---------------------------------------------- |
| `UNAUTHORIZED` | 401  | Missing or invalid JWT                         |
| `NOT_FOUND`    | 404  | Resource does not exist                        |
| `FORBIDDEN`    | 403  | Resource belongs to another user               |
| `CONFLICT`     | 409  | <Specific conflict condition for this feature> |

---

## Data Model

```prisma
model <ModelName> {
  // relevant fields only — trim unrelated ones
}
```

<Note important field semantics: enums, nullable fields, defaults, derived values.>

---

## Dependencies

- **Auth** — all endpoints require a valid JWT; userId is scoped from `req.user.id`
- **<Other feature>** — <why this feature relies on it>

---

## Notes

<Implementation quirks, known limitations, planned improvements, anything that would surprise a new developer reading this code for the first time.>
````

### If updating — merge strategy

1. Compare each section in the existing file against what you found in the code.
2. Sections that still match the code → keep them unchanged.
3. Sections where the code has changed (new endpoint, renamed component, new business rule) → rewrite only those sections.
4. Sections covered by the template that are missing from the existing file → add them.
5. **Never remove the Notes section** — append new observations to it instead of replacing.
6. Bump the `Last updated` date to today.
7. Write the final merged content as the complete new file.

---

## Phase 4: Update docs/INDEX.md

After writing the feature doc, read `docs/INDEX.md`.

**File exists** — add or update the entry for this feature under `## Features`. Leave all other entries untouched.

**File does not exist** — create it:

```markdown
# Documentation Index

## Architecture

- [Architecture Overview](ARCHITECTURE.md) — Tech stack decisions, route access, API format, DB schema, deployment

## Features

- [<Feature Display Name>](features/<name>.md) — <one-line description>

## API Reference

- See [Architecture Overview](ARCHITECTURE.md) for full endpoint reference

## Guides

- _(Coming soon)_
```

Tell the user:

> Done. Created/updated `docs/features/<name>.md` and updated `docs/INDEX.md`.

List any sections you had to mark as partial or planned because the code was not yet implemented.
