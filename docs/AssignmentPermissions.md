# Assignment Permissions

| Permission | student | faculty | institution_admin |
| --- | --- | --- | --- |
| `assignment:read` | ✓ | ✓ | ✓ |
| `assignment:write` | ✓ (own submit / comment) | ✓ | ✓ |
| `assignment:manage` | | | ✓ |

## Service scoping

| Actor | Assignments | Submissions | Grades / comments |
| --- | --- | --- | --- |
| Institution admin | Full tenant CRUD + import | Full | Full |
| Faculty | Create/update own (or course-scoped); publish/archive/close | Grade for own courses | Write feedback |
| Student | Read published for enrolled courses | Own drafts/submits only | Read own grades; reply in threads |

## Enrollment gate

Student write paths require an enrollment on `courseId` with status in `{ active, approved, completed }` (exact set enforced in service helpers).

## Constants

- `@learnova/constants` → `PERMISSIONS.ASSIGNMENT_READ|WRITE|MANAGE`
- `@learnova/shared` → `ROLE_PERMISSIONS`
