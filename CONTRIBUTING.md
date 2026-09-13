# Contributing to Budget Tracker

Thanks for your interest in contributing! `claude-budget-tracking` is a full-stack budgeting and expense tracking app (Next.js frontend, Express/Prisma backend). This guide covers how to propose changes — for local setup, see [README.md](README.md); for in-depth architecture and conventions, see [CLAUDE.md](CLAUDE.md) and [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Ways to Contribute

- **Bug reports** — open an issue (see [Reporting Issues](#reporting-issues) below).
- **Feature suggestions** — open an issue describing the use case before starting large work, so we can align on approach first.
- **Pull requests** — bug fixes, features, docs, and test improvements are all welcome.

## Development Setup

Follow the Quick Start in [README.md](README.md) (Docker Postgres, `pnpm install` for both `backend/` and `frontend/`, Prisma migrate/seed, `pnpm dev`). Don't duplicate those steps here — if they're out of date, that's a bug worth its own PR.

## Branching & Workflow

- Branch off `main` using a prefix that matches the change: `feature/<name>`, `fix/<name>`, `update/<name>`, `chore/<name>`, or `docs/<name>`.
- All changes land on `main` via pull request — no direct pushes to `main`.
- If you're using Claude Code against this repo, it ships with `new-feature`, `fix-update`, and `commit-push` skills that automate this exact branch → implement → commit → PR flow. See [docs/ONBOARDING.md](docs/ONBOARDING.md) for the full skill list.

## Code Style & Conventions

- TypeScript strict mode throughout — no `any`.
- Format with Prettier before committing: `npx prettier --write .` (config in root `.prettierrc`). There is currently no lint script/ESLint config in this repo, so Prettier + `tsc` are the enforcement mechanisms.
- Frontend and backend each have detailed rules (folder structure, PrimeReact component usage, Zod schema conventions, API response format, Prisma patterns, etc.) documented in [CLAUDE.md](CLAUDE.md) — read the section relevant to your change before opening a PR.

## Commit Messages

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(accounts): add credit account type
fix(auth): revoke sessions on password change
docs: update onboarding guide
refactor(dashboard): simplify summary query
chore(deps): bump prisma to 6.x
```

## Testing & Type-Checking

Run these before opening a PR — a PR should not regress either:

```bash
# Backend tests (use npx jest — pnpm test fails due to bcrypt build script policy)
cd backend && npx jest

# Backend type-check
cd backend && npx tsc --noEmit

# Frontend tests
cd frontend && pnpm test:run

# Frontend type-check
cd frontend && pnpm tsc --noEmit
```

## Pull Request Process

1. Branch from the latest `main` using the naming convention above.
2. Keep PRs focused — one fix or feature per PR is easier to review than a bundle of unrelated changes.
3. Write a clear description: what changed and why, and link any related issue.
4. Make sure tests and type-checks pass (see above).
5. Request review. Address feedback with new commits rather than force-pushing over review history, unless asked to squash.

## Reporting Issues

When filing a bug report, please include:

- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, Node version, browser if frontend-related)

## License

This project is licensed under the [MIT License](LICENSE). By submitting a contribution, you agree it will be licensed under the same terms.
