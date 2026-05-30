---
name: fix-update
description: >
  Orchestrates a targeted fix or update workflow: creates a fix/ or update/
  branch from latest main, plans the changes with user confirmation before any
  code is written, implements, verifies, then pushes and opens a PR to main.
  ALWAYS invoke this skill when the user says anything like: "fix this bug",
  "fix this issue", "update this", "patch this", "make a fix", "make an update",
  or "/fix-update <description>".
---

# Fix / Update Workflow

Five phases: **branch setup → understand + plan → implement → verify → push + PR**.

The key rule: **no code is written until the user confirms the plan.**

---

## Phase 1: Branch Type + Name

### 1a. Gather info

Ask both questions in a single message (skip question 2 if a description was provided as an argument):

1. "Is this a **fix** (bug, regression, broken behaviour) or an **update** (improvement, refactor, minor enhancement)?"
2. "Briefly describe it in a few words — this becomes the branch name (e.g. `login-redirect-bug`)."

### 1b. Create the branch

- Convert the description to kebab-case (lowercase, spaces/underscores → hyphens, strip special chars).
- Branch prefix: **fix** → `fix/<name>`, **update** → `update/<name>`

Run sequentially:

```bash
git checkout main
git pull origin main
git checkout -b fix/<kebab-name>   # or update/<kebab-name>
```

- If a branch with that name already exists, stop and tell the user to either switch to it manually or choose a different name.

### 1c. Confirm

> Branch `fix/<kebab-name>` created from latest main. Let's plan the changes.

---

## Phase 2: Understand + Plan

### 2a. Get context

Ask: **"Describe the issue or what needs to change — as much detail as you have."**

Wait for the user's answer before exploring any code.

### 2b. Explore (read-only)

Read the relevant files, grep for the affected symbols or patterns. Do **not** make any edits yet.

### 2c. Draft a plan

Write a numbered implementation plan that covers:

- Root cause or what exactly needs to change and why
- Specific files and functions to modify
- Order of changes
- Any edge cases or risks to watch for

### 2d. Present and wait

Show the plan to the user in a clear numbered list, then ask:

> **"Does this plan look right? Any changes before I start?"**

**Do not write any code until the user explicitly confirms.** If they request changes, revise the plan and present again.

---

## Phase 3: Implementation

- Execute the confirmed plan step by step.
- After each logical step, give a one-line status update (e.g. "Updated `authMiddleware.ts` to check token expiry.").
- If you discover something unexpected mid-implementation that changes the plan, pause, describe the finding, and ask the user how to proceed.

**Frontend reminder:** Always use PrimeReact components before native HTML — see CLAUDE.md Frontend Rules → PrimeReact Components for the full mapping and `pt` passthrough pattern. Never write a native `<button>`, `<input>`, `<select>`, custom modal portal, or `<table>` when a PrimeReact equivalent exists.

---

## Phase 4: Verify + Test

Run the following checks relevant to this project:

```bash
# Frontend type-check
cd frontend && pnpm tsc --noEmit

# Backend type-check
cd backend && pnpm tsc --noEmit
```

Also run any test suite that exists for the affected area.

Then:

- Re-read every file you changed and do a self-review — flag anything that looks wrong, incomplete, or risky.
- Report: what was changed, what was tested, any caveats or follow-up items.

Finally, ask:

> **"Please verify the fix/update on your end. Let me know when you're happy and I'll open the PR."**

**Wait for user confirmation before proceeding to Phase 5.**

---

## Phase 5: Push + PR

Once the user confirms they're satisfied, say:

> All good. Committing, pushing to `fix/<kebab-name>`, and opening a PR to main now.

Invoke the `commit-commands:commit-push-pr` skill, which will:

1. Stage all changes (excluding any `.env` or secrets files)
2. Draft a Conventional Commits message (`fix(scope): ...` or `refactor(scope): ...`) and wait for approval
3. Commit, push to the branch, and open a ready-for-review PR targeting `main`
