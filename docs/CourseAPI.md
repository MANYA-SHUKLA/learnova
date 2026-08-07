# Course API

Base path: `/api/v1/courses`

## Read (`course:read`)

| Method | Path |
| --- | --- |
| GET | `/courses` |
| GET | `/courses/search` |
| GET | `/courses/stats` |
| GET | `/courses/export` |
| GET | `/courses/audit` |
| GET | `/courses/:id` |

## Write (`course:write`)

| Method | Path |
| --- | --- |
| POST | `/courses/:id/thumbnail` |
| DELETE | `/courses/:id/thumbnail` |

## Manage (`course:manage`)

| Method | Path |
| --- | --- |
| POST | `/courses` |
| PUT/PATCH | `/courses/:id` |
| DELETE | `/courses/:id` (soft delete) |
| POST | `/courses/:id/restore` |
| POST | `/courses/:id/publish` |
| POST | `/courses/:id/unpublish` |
| POST | `/courses/:id/archive` |
| POST | `/courses/:id/duplicate` |
| POST | `/courses/import/preview` |
| POST | `/courses/import` |
| POST | `/courses/bulk/publish` |
| POST | `/courses/bulk/unpublish` |
| POST | `/courses/bulk/archive` |
| POST | `/courses/bulk/delete` |
| POST | `/courses/bulk/status` |
| POST | `/courses/bulk/assign-faculty` |
| POST | `/courses/bulk/assign-program` |
| POST | `/courses/bulk/assign-semester` |

## Query filters

`q`, `status`, `visibility`, `difficulty`, `category`, `language`, `campusId`, `schoolId`, `departmentId`, `programId`, `semesterId`, `facultyId`, `coordinatorId`, `creditsMin`, `creditsMax`, `includeDeleted`, `page`, `limit`, `sortBy`, `sortOrder`

## Search fields

Title · Course code · Faculty · Department · Program · Semester · Tags · Category

## Sort options

`createdAt` · `updatedAt` · `title` · `credits` · `estimatedHours` · `courseCode`

## Domain events

`course.created` · `course.updated` · `course.deleted` · `course.published` · `course.archived`

## Audit events

`course.created` · `course.updated` · `course.deleted` · `course.restored` · `course.published` · `course.archived` · `course.duplicated` · `course.assigned.faculty` · `course.imported` · `course.exported`
