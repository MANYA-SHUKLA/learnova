# Performance

Production performance guidelines for Learnova — indexes, caching, pagination, API budgets, and verification.

---

## Platform phase status

| Phase | Status |
| --- | --- |
| Enterprise UI/UX polish | Done |
| RBAC & Security hardening | Done |
| Seed data completion | Done |
| **Performance optimization** | **Done** |
| Notifications | Pending |
| Analytics | Pending |
| Deployment & production readiness | Pending |

---

## Database indexes

### Policy

- Every tenant list query filters on `institutionId` + `deletedAt` (+ `status` where applicable).
- Compound indexes align with list/sort patterns — not just single-field `index: true`.
- After schema changes, run **`pnpm db:indexes`** before deploy.

### Key compounds (ERP core)

| Collection | Index |
| --- | --- |
| `courses` | `{ institutionId, deletedAt, status, createdAt }` |
| `courses` | `{ facultyIds, deletedAt }` (faculty scoping) |
| `students` | `{ institutionId, deletedAt, status, createdAt }` |
| `faculty` | `{ institutionId, deletedAt, status, createdAt }` |
| `faculty` | `{ courseIds, deletedAt }` |

Domain models (gradebook, enrollments, quizzes, exams, etc.) already ship query-aligned compounds — see individual model files under `apps/backend/src/models/`.

### Sync script

```bash
pnpm db:indexes
```

Runs `Model.syncIndexes()` for all registered Mongoose models.

---

## Query optimization

### Gradebook

- **Institution dashboard** uses a single aggregation (`aggregateInstitutionStats`) instead of per-course loops.
- **Publish snapshots** batch-loads gradebook entries with `$in: studentIds` instead of one query per student.

### Progress

- Module rollup prefetches all module progress for a course once, then upserts in memory — no per-module `find` in the hot path.

### Repositories

- Prefer `.lean()` + field projection on list endpoints (ongoing rollout).
- Avoid unbounded `find()` without pagination except export jobs (stream or queue separately).

---

## Redis caching

`CacheService` (`apps/backend/src/cache/cache.service.ts`) wraps hot reads:

| Key pattern | TTL | Invalidated on |
| --- | --- | --- |
| `institution-settings:{institutionId}` | MEDIUM | settings update |

Extend with org catalog lists and permission bundles as read patterns stabilize.

Namespace: `cache:institution:*` (see `REDIS_KEYS.CACHE` in `@learnova/constants`).

---

## Pagination

- Default page size: **20** (`PAGINATION.DEFAULT_LIMIT`)
- Hard cap: **100** (`PAGINATION.MAX_LIMIT`) — enforced in Zod validation
- Entity pickers fetch **25** rows with server-side search (`q` param), not 100+ client-side rows

---

## Frontend

### Entity selects

- Search debounces 300ms → API `q` parameter
- Scrollable native `<select size={6}>` — no manual ObjectId entry
- Components: `apps/frontend/src/components/shared/entity-selects.tsx`

### React Query

Global defaults in `query-provider.tsx`:

- `staleTime: 60_000`
- `refetchOnWindowFocus: false`

### Bundle (recommended next)

- Dynamic-import Monaco (`@monaco-editor/react`) on lab routes
- Dynamic-import Recharts on institution dashboard
- Add `@next/bundle-analyzer` script when bundle budgets are enforced in CI

---

## Verification

`pnpm verify:platform` includes a **Performance** section:

| Check | Budget |
| --- | --- |
| `GET /courses?page=1&limit=20` latency | < 3s (local dev) |
| `limit=9999` request | capped at ≤ 100 items |
| Course list compound index | present on `courses` |

Run after seeds and with backend on `:4000`:

```bash
pnpm dev:backend
pnpm verify:platform
```

---

## Related docs

- [Architecture](./Architecture.md)
- [Redis](./Redis.md)
- [Monitoring](./Monitoring.md)
- [Deploy](./Deploy.md)
