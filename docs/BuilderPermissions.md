# Builder Permissions

Course Builder uses existing course permissions — no new permission keys.

| Permission | Builder access |
| --- | --- |
| `course:write` | Required for **all** builder APIs and UI |
| `course:manage` | Implies write (institution admin) |
| `course:read` | Catalog only — **not** enough for builder |

## Role matrix

| Role | Access |
| --- | --- |
| Institution Admin | Full builder on all tenant courses |
| Faculty | Builder only on courses they coordinate or are assigned to (`coordinatorId` / `facultyIds`) |
| Student | **No builder access** |

## Enforcement

1. Route middleware: `authenticate` + `requirePermission(COURSE_WRITE)`
2. Service: reject `role === student`; faculty scoped via course assignment
