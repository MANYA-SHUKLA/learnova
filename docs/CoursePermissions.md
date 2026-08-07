# Course Permissions

| Permission | Description |
| --- | --- |
| `course:read` | Directory, detail, stats, search, export, audit |
| `course:write` | Thumbnail upload / remove |
| `course:manage` | Full CRUD, lifecycle, bulk ops, import, assignments |

## Role matrix

| Role | Access |
| --- | --- |
| Institution Admin | Everything (`read` + `write` + `manage`) |
| Faculty | Own courses and assigned courses (`read` / manage scoped); listed when `facultyIds` contains the faculty record or `coordinatorId` matches |
| Student | Read-only enrolled courses (enrollment module later; until then catalog read is permission-gated) |

## Scoping notes

- Institution admin sees all courses in the tenant.
- Faculty list/get/update is scoped to courses they coordinate or are assigned to (and department-aligned records where enforced by service).
- Soft delete only — restore returns archived/deleted records to the catalog.
