# Faculty Permissions

| Permission | Description |
| --- | --- |
| `faculty:read` | View faculty directory, profiles, stats, exports |
| `faculty:write` | Edit own profile, office hours, photo |
| `faculty:manage` | Full CRUD, bulk ops, import |

## Role matrix

| Role | Permissions |
| --- | --- |
| Institution Admin | `faculty:read`, `faculty:write`, `faculty:manage` |
| Faculty | `faculty:read`, `faculty:write` |
| Student | `faculty:read` (public directory) |

## Enforcement

- Route middleware: `requirePermission(...)`
- Own-profile photo / PATCH `/faculty/me` matches actor email to faculty email
- Seeds: `apps/backend/src/seeds/auth.seed.ts` includes faculty permission metadata
