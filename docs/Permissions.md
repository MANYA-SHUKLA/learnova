# Permissions

Permissions follow `{domain}:{action}` — e.g. `course:read`, `student:manage`.

## Matrix

Defined in `packages/shared/src/permissions/index.ts` and seeded via `pnpm seed:auth`.

## Middleware usage

```typescript
authenticate({ required: true })
requirePermission(PERMISSIONS.COURSE_READ)
```

Permissions are embedded in the JWT at login from the role matrix (and DB role sync when applicable).

## Rules

- **Never** trust UI visibility — every API handler checks permissions independently.
- Students do **not** receive `faculty:*` or `institution:*` permissions.
- Faculty receive `student:read` but list/get endpoints scope to enrolled students only.
- Institution management (`institution:manage`, `student:manage`, …) is admin-only.

## Tests

`backend/src/__tests__/security/rbac.test.ts` and per-module `permissions.test.ts` files validate matrix constants.
