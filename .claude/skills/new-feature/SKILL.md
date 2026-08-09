---
name: new-feature
description: >
  Orchestrates the full lifecycle of a new feature: creates a feature branch
  from latest main, runs the guided feature-dev workflow, documents the
  feature, then commits, pushes, and opens a PR to main when done. ALWAYS
  invoke this skill when the user says anything like: "new feature", "create
  new feature", "create a new feature", "start feature", "create feature",
  "implement feature", "add feature", "build feature", "begin feature", or
  "/new-feature <name>".
---

# New Feature Workflow

Six phases: **branch setup → guided development → documentation → tests → code review → push + PR**.

---

## Phase 1: Branch Setup

### 1a. Get the feature name

If the user provided a name as an argument (e.g. `/new-feature expense-categories`), use it.
Otherwise ask: **"What's the name of this feature? (used for the branch name, e.g. `expense-categories`)"** — wait for their answer before continuing.

Convert the name to kebab-case: lowercase, spaces and underscores become hyphens, strip special characters.

### 1b. Create the branch

Run sequentially:

```bash
git checkout main
git pull origin main
git checkout -b feature/<kebab-name>
```

- If `git checkout main` fails (e.g. main is called `master`), use the correct default branch name
- If a branch named `feature/<kebab-name>` already exists, stop and tell the user: "Branch `feature/<kebab-name>` already exists — switch to it manually or choose a different name."

### 1c. Confirm

Tell the user:

> Branch `feature/<kebab-name>` created from latest main. Starting feature development...

---

## Phase 2: Feature Development

Invoke the `feature-dev:feature-dev` skill to run the full guided development workflow (Discovery → Codebase Exploration → Clarifying Questions → Architecture Design → Implementation → Quality Review → Summary). Show the detailed instructions and plan for each step and wait for user to confirm before moving to next step.

**Frontend reminder:** Always use PrimeReact components before native HTML — see CLAUDE.md Frontend Rules → PrimeReact Components for the full mapping and `pt` passthrough pattern. Never write a native `<button>`, `<input>`, `<select>`, custom modal portal, or `<table>` when a PrimeReact equivalent exists.

All code changes during this phase automatically land on `feature/<kebab-name>`.

---

## Phase 3: Documentation

Once feature-dev implementation is complete, document the feature before writing tests.

### 3a. Backend JSDoc

If any files under `backend/src/services/`, `backend/src/controllers/`, or `backend/src/middleware/` changed during Phase 2, invoke the `backend-jsdoc` skill to verify every new/changed function in those files has an up-to-date JSDoc block, adding or updating any that are missing. Skip if no backend files changed.

### 3b. Feature docs

Invoke the `feature-docs` skill for `<kebab-name>` to create or update `docs/features/<kebab-name>.md` and keep `docs/INDEX.md` in sync.

Tell the user:

> Documentation complete (JSDoc + docs/features/<kebab-name>.md). Moving on to tests.

---

## Phase 4: Tests

Once documentation is complete, before touching git, identify what needs testing and make all tests pass.

### 4a. Identify changed files

```bash
git diff --name-only main
```

Group changed paths by side:

- **Frontend** — anything under `frontend/` (excluding `frontend/__tests__/`)
- **Backend** — anything under `backend/src/` (excluding `backend/__tests__/`)

### 4b. Create or update test files

For each changed source file, check whether a corresponding test file exists:

| Changed file                                    | Expected test location                                         |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `frontend/features/<feat>/components/Foo.tsx`   | `frontend/__tests__/features/<feat>/components/Foo.test.tsx`   |
| `frontend/features/<feat>/hooks/useBar.ts`      | `frontend/__tests__/features/<feat>/hooks/useBar.test.ts`      |
| `frontend/features/<feat>/schemas/barSchema.ts` | `frontend/__tests__/features/<feat>/schemas/barSchema.test.ts` |
| `frontend/components/ui/Widget.tsx`             | `frontend/__tests__/components/ui/Widget.test.tsx`             |
| `backend/src/services/fooService.ts`            | `backend/__tests__/src/services/fooService.test.ts`            |
| `backend/src/utils/bar.ts`                      | `backend/__tests__/src/utils/bar.test.ts`                      |

**If the test file does not exist:** write it now, covering the key behaviours of the changed code (happy paths + important error/edge cases).

**If the test file already exists:** review it against the new code and add or update tests for any new/changed behaviour.

**Frontend test patterns** (Vitest + React Testing Library):

- Import test utilities from `vitest`, render components with `@testing-library/react`
- Mock PrimeReact components as plain HTML, mock `AppShell` as `<div>{children}</div>`
- Mock hooks with `vi.mock('@/features/.../hooks/useXxx')` and `vi.mocked(...).mockReturnValue(...)`
- Run with: `cd frontend && pnpm test:run`

**Backend test patterns** (Jest):

- `jest.mock('../../../src/lib/prisma', () => ({ prisma: { ... } }))` before imports
- `$transaction`: `db.$transaction.mockImplementation((fn) => fn(mockTx))`
- Run with: `cd backend && npx jest`

### 4c. Run the full test suite(s)

Run tests for every side that has changed files:

```bash
# If frontend files changed:
cd frontend && pnpm test:run

# If backend files changed:
cd backend && npx jest
```

### 4d. Fix failures before continuing

If any tests fail, fix the underlying code or tests until the full suite is green. Do **not** proceed to Phase 5 until all tests pass.

Once green, tell the user:

> All tests pass. Moving on to code review.

---

## Phase 5: Code Review

Once tests are green, review the branch in an isolated context rather than self-reviewing — a session reviewing its own work in its own context tends to confirm its decisions rather than test them.

1. Write the diff to a file the reviewer can read — it has no Bash tool and cannot produce this itself:

   ```bash
   git diff main > /tmp/review-diff.patch
   git diff --name-only main
   ```

2. Launch the reviewer in a fresh context via the Agent tool with
   `subagent_type: "feature-dev:code-reviewer"` and `run_in_background: false`
   (the result is needed before continuing). In the prompt, give it:
   - the path `/tmp/review-diff.patch` and an instruction to read it first
   - the list of changed file paths, so it can open the full files for context
   - an explicit pointer to `CLAUDE.md` at the repo root as the project guidelines
   - the reminder: report only findings with confidence >= 80

3. The agent's report is not shown to the user — relay it. Present findings as a
   numbered list with file paths and line references, then ask:
   **"Which of these would you like me to fix?"**
   Wait for the answer. Do not apply fixes or proceed until the user responds.

4. If the agent reports no high-confidence issues, say so in one line and continue.

5. If the user approves fixes, apply them, then re-run the test suites from Phase 4c before moving on.

Use `/tmp/review-diff.patch` — never a path inside the repo, so the patch never lands in a commit.

Once review is resolved, tell the user:

> Code review complete. Ready to commit and open a PR.

---

## Phase 6: Push + PR

Once documentation, tests, and code review are complete and the user confirms they are done, say:

> Feature development complete. I'll now commit everything, push to `feature/<kebab-name>`, and open a PR to main.

Then invoke the `commit-commands:commit-push-pr` skill, which will:

1. Stage all changes
2. Draft a Conventional Commits message and wait for your approval
3. Commit, push to `feature/<kebab-name>`, and open a ready-for-review PR targeting `main`
