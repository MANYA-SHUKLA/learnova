# Faculty API

Base path: `/api/v1/faculty`

All endpoints require authentication.

## Read (`faculty:read`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/faculty` | List + filters + pagination |
| GET | `/faculty/search?q=` | Search |
| GET | `/faculty/stats` | Dashboard stats |
| GET | `/faculty/export?format=csv\|excel\|pdf` | File download |
| GET | `/faculty/audit` | Audit log (`facultyId` optional) |
| GET | `/faculty/:id` | Detail |

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
| DELETE | `/faculty/:id` (archive) |
| POST | `/faculty/:id/restore` |
| POST | `/faculty/import/preview` |
| POST | `/faculty/import` |
| POST | `/faculty/bulk/archive` |
| POST | `/faculty/bulk/activate` |
| POST | `/faculty/bulk/suspend` |
| POST | `/faculty/bulk/status` |
| POST | `/faculty/bulk/assign-department` |
| POST | `/faculty/bulk/assign-program` |

## List query filters

`q`, `status`, `campusId`, `schoolId`, `departmentId`, `programId`, `designation`, `employmentType`, `joiningDateFrom`, `joiningDateTo`, `experienceMin`, `experienceMax`, `includeDeleted`, `page`, `limit`, `sortBy`, `sortOrder`

## Status values

`active`, `on_leave`, `suspended`, `retired`, `archived`
