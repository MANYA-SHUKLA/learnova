# Student API

Base path: `/api/v1/students`

## Read (`student:read`)

| Method | Path |
| --- | --- |
| GET | `/students` |
| GET | `/students/search` |
| GET | `/students/stats` |
| GET | `/students/export` |
| GET | `/students/audit` |
| GET | `/students/:id` |

## Write own profile (`student:write`)

| Method | Path |
| --- | --- |
| GET | `/students/me` |
| PATCH | `/students/me` |
| POST | `/students/:id/photo` |
| DELETE | `/students/:id/photo` |

## Manage (`student:manage`)

| Method | Path |
| --- | --- |
| POST | `/students` |
| PUT/PATCH | `/students/:id` |
| DELETE | `/students/:id` (archive / soft delete) |
| POST | `/students/:id/restore` |
| POST | `/students/:id/activate` |
| POST | `/students/:id/deactivate` |
| POST | `/students/import/preview` |
| POST | `/students/import` |
| POST | `/students/bulk/archive` |
| POST | `/students/bulk/activate` |
| POST | `/students/bulk/suspend` |
| POST | `/students/bulk/status` |
| POST | `/students/bulk/assign-department` |
| POST | `/students/bulk/assign-section` |
| POST | `/students/bulk/assign-semester` |
| POST | `/students/bulk/assign-batch` |

## Query filters

`q`, `status`, `campusId`, `schoolId`, `departmentId`, `programId`, `academicYearId`, `semesterId`, `sectionId`, `batchId`, `yearOfStudy`, `scholarship`, `includeDeleted`, `page`, `limit`, `sortBy`, `sortOrder`

## Search fields

Name · Student ID · Admission Number · Roll Number · Email

## Assignment fields

- `campusId`, `schoolId`, `departmentId`, `programId`
- `academicYearId`, `semesterId`, `sectionId`, `batchId`
- `yearOfStudy`, `currentSemester`

## Status values

`active` · `inactive` · `suspended` · `graduated` · `dropped` · `transferred` · `archived`

## Domain events

`student.created` · `student.updated` · `student.deleted` · `student.status.changed` · `student.imported`

## Audit events

`student.created` · `student.updated` · `student.archived` · `student.restored` · `student.deleted` · `student.import.started` · `student.import.completed` · `student.imported` · `student.export` · `student.exported` · `student.profile.updated` · `student.status.changed`
