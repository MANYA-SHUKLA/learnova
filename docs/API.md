# Institution API

Base: `/api/v1`  
Auth: Bearer access token  
Permissions: `institution:read` (GET), `institution:manage` (mutations)

All successful responses use the standard envelope `{ success, data, meta?, requestId, timestamp }`.

## Institutions

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/institutions/me` | Current tenant institution |
| GET | `/institutions` | List (tenant sees self; super_admin sees all) |
| POST | `/institutions` | Create using JWT `institutionId` as `_id` |
| GET | `/institutions/:id` | Get by id |
| PUT/PATCH | `/institutions/:id` | Update |
| PATCH | `/institutions/:id/branding` | `{ logo?, favicon? }` URLs |
| DELETE | `/institutions/:id` | Soft archive |
| POST | `/institutions/:id/restore` | Restore |

## Tenant resources

Resources share the same CRUD pattern:

`GET|POST /{resource}`  
`GET|PUT|PATCH|DELETE /{resource}/:id`  
`POST /{resource}/:id/restore`

| Resource path | Create body highlights |
| --- | --- |
| `/campuses` | name, code, address… |
| `/schools` | name, code, description |
| `/departments` | schoolId, name, code |
| `/programs` | departmentId, name, code, durationYears, credits, level |
| `/academic-years` | name, startDate, endDate, isActive |
| `/semesters` | academicYearId, name, number, term |
| `/sections` | programId, semesterId, name, capacity |
| `/batches` | programId, name, year |
| `/academic-calendars` | academicYearId, name, events[] |

## List query parameters

| Param | Description |
| --- | --- |
| `q` | Search (name/code where applicable) |
| `status` | `active` \| `inactive` \| `archived` |
| `includeDeleted` | Include soft-deleted |
| `schoolId`, `departmentId`, `programId`, `academicYearId`, `semesterId` | Relation filters |
| `page`, `limit` | Pagination |
| `sortBy`, `sortOrder` | Sorting (`asc` \| `desc`) |

`meta`: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`

## Settings

| Method | Path |
| --- | --- |
| GET | `/institution-settings` |
| PUT/PATCH | `/institution-settings` |

## Validation

Shared Zod schemas in `@learnova/validation` (`institution.ts`). Controllers do not re-validate — `validate()` middleware only.

## Errors

| Code | When |
| --- | --- |
| 401 | Missing/invalid token |
| 403 | Missing permission or cross-tenant |
| 404 | Not found / wrong tenant |
| 409 | Unique constraint (slug/code/email) |
| 400 | Validation failure |

## Audit collection

`institution_audit_logs` — events such as `institution.created`, `department.updated`, `calendar.updated`, `settings.updated`.
