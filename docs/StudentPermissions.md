# Student Permissions

| Permission | Description |
| --- | --- |
| `student:read` | Directory, profiles, stats, exports |
| `student:write` | Own profile (limited fields), photo |
| `student:manage` | Full CRUD, bulk ops, import, activate/suspend |

## Role matrix

| Role | Access |
| --- | --- |
| Institution Admin | Full access (`read` + `write` + `manage`) |
| Faculty | View students in assigned department (`read`); export assigned students |
| Student | Own profile only (`read` + `write` on `/students/me`) |

## Scoping notes

- Institution admin sees all students in the tenant.
- Faculty list/get/export is filtered to students whose `departmentId` matches the faculty member’s assigned department.
- Students can only read/update their own record via `/students/me` (matched by email + institution).
