---
name: commit-push
description: >
  Creates a well-formatted Conventional Commits message, presents it for user
  review and approval, then commits and pushes to the current GitHub branch.
  ALWAYS invoke this skill when the user says anything like: "push to branch",
  "push my changes", "commit and push", "push to github", "let's push this",
  "push this", "push to origin", "commit my changes", "ready to push", "push
  my work", "commit this", or any phrasing that involves committing and/or
  pushing code. Do NOT use this skill when the user asks to open a PR — use
  commit-push-pr for that instead.
---

# Commit and Push to GitHub

Analyze changes → code review (isolated subagent) → propose Conventional Commits message → wait for user approval → commit → pull → push.

---

## Step 1: Gather Context

Run all of these in parallel (read-only):

```bash
git status
git diff HEAD
git branch --show-current
git log --oneline -5
```

Use the results to understand:

- Which files changed and what they do
- Which files are already staged vs unstaged
- The current branch name
- Whether the repo already follows a commit convention (adapt if so)

---

## Step 1.5: Code Review (isolated context)

Skip this step and go straight to Step 2 when either applies:

- The diff from Step 1 touches only `*.md`, `docs/`, or config/lockfiles (docs-only change) — say "Docs-only change, skipping code review."
- The user's phrasing was explicitly just-commit ("commit this", "wip") — offer the review instead of forcing it: ask if they want one before proceeding.

Otherwise:

1. Write the diff to a file the reviewer can read — it has no Bash tool and cannot produce this itself:

   ```bash
   git diff HEAD > /tmp/review-diff.patch
   git diff --name-only HEAD
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

5. If the user approves fixes, apply them, then re-run `git diff HEAD` (Step 1) before drafting the commit message — the message must describe the final code, not the pre-review version.

Use `/tmp/review-diff.patch` — never a path inside the repo, so the patch never lands in a commit.

---

## Step 2: Draft the Commit Message

Use **Conventional Commits** format:

```
type(scope): short description

Optional body explaining WHY the change was made.
Wrap lines at 72 characters.

Footer: Closes #N  or  BREAKING CHANGE: description
```

**Rules:**

- Subject line: max 72 characters, imperative mood ("add" not "added"), no trailing period
- Body: optional — only include if the subject alone doesn't convey intent
- Footer: include `Closes #N` when fixing a tracked issue; omit otherwise

### Types

| Type       | When to use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New user-facing feature or functionality   |
| `fix`      | Bug fix                                    |
| `refactor` | Code restructure with no behavior change   |
| `style`    | Formatting only, no logic change           |
| `docs`     | Documentation changes only                 |
| `test`     | Adding or updating tests                   |
| `chore`    | Build, config, tooling, dependency updates |
| `perf`     | Performance improvement                    |

### Scopes for this project

- **Frontend:** `auth`, `expenses`, `income`, `categories`, `summary`, `dashboard`, `ui`, `charts`
- **Backend:** `api`, `auth`, `expenses`, `income`, `categories`, `middleware`, `db`
- **Cross-cutting:** `types`, `config`, `deps`, `prisma`

Omit scope when the change is truly cross-cutting (e.g., a repo-wide config change).

**Examples:**

```
feat(expenses): add date range filter to expense list

fix(auth): redirect authenticated users away from login page

refactor(categories): extract category validation into service layer

chore(deps): upgrade Prisma to v6.1
```

---

## Step 3: Present for Review

Show the user:

1. The proposed commit message in a code block
2. A brief list of the files that will be committed
3. Ask explicitly: **"Does this commit message look good, or would you like to adjust it?"**

**Stop here and wait for the user's response. Do not proceed to commit until they confirm.**

If the user edits the message or asks for changes, revise and present again before proceeding.

---

## Step 4: Commit and Push (only after approval)

### 4a. Stage files

Stage all modified and new tracked files:

```bash
git add -A
```

Before staging, check `git status` output for any sensitive files that should NOT be committed:

- `.env`, `.env.local`, `.env.*` — never stage
- `*.pem`, `*.key`, `secrets.*` — never stage

If any are present in the untracked/modified list, **warn the user and exclude them** from staging (`git add` each file individually instead of `-A`).

### 4b. Commit

```bash
git commit -m "$(cat <<'EOF'
type(scope): approved message here
EOF
)"
```

Use a HEREDOC to preserve multi-line messages correctly.

### 4c. Pull before push

Sync with remote to catch any upstream changes:

```bash
git pull --rebase origin <branch>
```

- **If rebase succeeds cleanly:** proceed to push
- **If merge conflicts arise:** stop immediately. List the conflicting files, show the conflict markers, and tell the user: "There are merge conflicts in these files — please resolve them manually, then run `git rebase --continue`, and I can push for you." Do NOT attempt to auto-resolve conflicts.
- **If the branch has no upstream yet:** skip this step (no remote to pull from)

### 4d. Push

```bash
# Branch already has an upstream:
git push origin <branch>

# New branch with no upstream:
git push -u origin HEAD
```

Report success with the branch name and commit SHA.

---

## Edge Cases

| Situation                    | Action                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing staged or changed    | Tell the user there's nothing to commit                                                                                                        |
| On `main` or `master`        | Warn: "You're on `main` — are you sure you want to push directly? Consider creating a feature branch." Wait for confirmation before proceeding |
| Remote branch doesn't exist  | Use `git push -u origin HEAD` instead of the standard push                                                                                     |
| Merge conflicts after pull   | Stop, show conflicting files, ask user to resolve manually                                                                                     |
| Sensitive files detected     | Warn and exclude from staging                                                                                                                  |
| Code review returns findings | Present findings and wait for user response. Never auto-commit over unreviewed findings.                                                       |
