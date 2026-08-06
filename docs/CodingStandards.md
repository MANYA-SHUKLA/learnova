# Coding Standards

## TypeScript

- **Strict mode** everywhere (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, …).
- **No `any`.** Use `unknown` and narrow.
- Prefer `type` imports (`import type { … }`).
- No JavaScript source files in apps or packages.

## Architecture rules

1. Controllers do not touch the database.
2. Services do not know about Express `Request`/`Response`.
3. Repositories are the only layer that talks to Mongo/Redis data stores.
4. Shared business rules (permissions, roles) live in `@learnova/shared` — never copy matrices.
5. API responses always use `sendSuccess` / `sendError` helpers.
6. Throw `AppError` subclasses; never leak raw errors to clients.

## Frontend

- Feature code stays under `features/<name>/`.
- Shared UI goes to `components/` or `@learnova/ui`.
- Forms: React Hook Form + Zod resolvers.
- Server state: TanStack Query. Client UI state: Zustand.
- Absolute imports via `@/` aliases — no deep relative paths across features.

## Naming

| Kind | Convention |
| --- | --- |
| Files | `kebab-case.ts` / `kebab-case.tsx` |
| React components | `PascalCase` |
| Functions / variables | `camelCase` |
| Constants | `SCREAMING_SNAKE` or `as const` objects |
| Types / interfaces | `PascalCase`; interfaces may use `I` prefix for ports only |

## Commits

Conventional Commits enforced by Commitlint.

```
feat(lms): add course outline types
fix(backend): correct request id header casing
chore(repo): bump turbo
```

Scopes: `frontend`, `backend`, `worker`, `ui`, `types`, `shared`, `config`, `docker`, `docs`, `ci`, `deps`, `auth`, `lms`, `erp`, `exam`, `coding`, `ide`, `ideation`, `analytics`, `audit`, `i18n`, `repo`.

## Formatting & lint

- Prettier is the formatter (incl. Tailwind class sorting).
- ESLint 9 flat configs from `@learnova/eslint-config`.
- Husky + lint-staged run on every commit.
- CI runs `lint`, `typecheck`, `format:check`, `build`.

## Testing (when added)

- Unit: co-located `*.test.ts` next to units or under `__tests__/`.
- Integration: API tests against testcontainers Mongo/Redis.
- E2E: Playwright against staging or local compose.
