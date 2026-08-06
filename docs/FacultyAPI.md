# Faculty API

Base path: `/api/v1/faculty`

## Read (`faculty:read`)

| Method | Path |
| --- | --- |
| GET | `/faculty` |
| GET | `/faculty/search` |
| GET | `/faculty/stats` |
| GET | `/faculty/export` |
| GET | `/faculty/audit` |
| GET | `/faculty/:id` |

## Write own profile (`faculty:write`)

| Method | Path |
| --- | --- |
| GET | `/faculty/me` |
| PATCH | `/faculty/me` |
| POST | `/faculty/:id/photo` |
| DELETE | `/faculty/:id/photo` |

## Manage (`faculty:manage`)

| Method | Path |
| --- | --- |
| POST | `/faculty` |
| PUT/PATCH | `/faculty/:id` |
| DELETE | `/faculty/:id` (archive / soft delete) |
| POST | `/faculty/:id/restore` |
| POST | `/faculty/:id/activate` |
| POST | `/faculty/:id/deactivate` |
| POST | `/faculty/import/preview` |
| POST | `/faculty/import` |
| POST | `/faculty/bulk/archive` |
| POST | `/faculty/bulk/activate` |
| POST | `/faculty/bulk/suspend` |
| POST | `/faculty/bulk/status` |
| POST | `/faculty/bulk/assign-department` |
| POST | `/faculty/bulk/assign-program` |
| POST | `/faculty/bulk/assign-academic` |

## Assignment fields

- `departmentId`, `programIds[]`
- `academicYearId`, `semesterId`
- `courseIds[]` — accepted as placeholders until the Course module

## Status values

`active` · `on_leave` · `suspended` · `retired` · `archived`

## Audit events

`faculty.created` · `faculty.updated` · `faculty.archived` · `faculty.restored` · `faculty.imported` · `faculty.exported` · `faculty.profile.updated` · `faculty.status.changed`
