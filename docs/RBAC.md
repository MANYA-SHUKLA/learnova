# RBAC

Active roles: `institution_admin`, `faculty`, `student`.

## Route prefixes (UI)

| Prefix | Role |
| --- | --- |
| `/institution/*` | `institution_admin` |
| `/faculty/*` | `faculty` |
| `/student/*` | `student` |

Cross-role navigation returns **403** (Next.js middleware rewrite to `/forbidden`).

## API

Every domain route uses `authenticate({ required: true })` + tiered permissions (`read` / `write` / `manage`).

Source of truth: `packages/shared/src/permissions/index.ts`.

## Data scoping (beyond permissions)

| Role | Scope |
| --- | --- |
| Faculty | Assigned/coordinator courses; enrolled students; own faculty profile |
| Student | Own ERP record, enrollments, grades, submissions |
| Institution admin | Full tenant |

Implemented in `backend/src/services/access/faculty-scope.ts` and applied in services.

## Verification

```bash
pnpm verify:platform
```

Checks role isolation (pages + API), faculty/student scoping counts, and seed minimums.
