# Contribution Guide

## Workflow

1. Create a branch from `develop` (or `main` if that is the default).
2. Keep PRs focused — one feature or fix per PR.
3. Follow Conventional Commits.
4. Ensure `pnpm lint && pnpm typecheck && pnpm build` pass locally.
5. Open a PR; CI must be green.

## Branch naming

```
feat/lms-course-list
fix/backend-rate-limit
chore/deps-turbo
docs/architecture-update
```

## Local setup

See [README](../README.md) Quick start and [Environment](./Environment.md).

## Code review expectations

- Types are complete; no `any`.
- New env vars added to local `.env` / `.env.local` and `docs/Environment.md`.
- Shared contracts updated in `@learnova/types` / `@learnova/shared` when APIs change.
- UI uses design tokens — no one-off hex colors.
- Auth/permission checks use the shared matrix.

## Do not

- Commit `.env` or secrets.
- Implement login or CRUD outside an approved feature ticket (foundation phase).
- Bypass Husky with `--no-verify` unless explicitly approved.
- Add duplicate permission lists in feature code.

## Adding a new locale

1. Add locale code to `SUPPORTED_LOCALES` in `@learnova/shared`.
2. Create `apps/frontend/messages/<locale>.json`.
3. Update middleware matcher and `locales` config.
4. Document in Environment/README if needed.

## Adding a new module feature

1. Create `apps/frontend/src/features/<module>/…`.
2. Add route group pages under `app/[locale]/(dashboard)/…`.
3. Mount API routes under `apps/backend/src/routes/v1/`.
4. Extend permissions in `@learnova/shared` if new capabilities are required.
5. Add queue/processor only if work is async.
