# Enrollment API

Base path: `/api/v1/enrollments`

## Read (`enrollment:read`)

| Method | Path |
| --- | --- |
| GET | `/enrollments` |
| GET | `/enrollments/search` |
| GET | `/enrollments/stats` |
| GET | `/enrollments/export` |
| GET | `/enrollments/audit` |
| GET | `/enrollments/me` |
| GET | `/enrollments/waitlist` |
| GET | `/enrollments/:id` |

## Write (`enrollment:write`)

| Method | Path |
| --- | --- |
| POST | `/enrollments/self` |
| POST | `/enrollments/waitlist/join` |
| POST | `/enrollments/waitlist/leave` |
| POST | `/enrollments/:id/approve` |
| POST | `/enrollments/:id/reject` |
| POST | `/enrollments/:id/withdraw` |
| POST | `/enrollments/:id/complete` |

## Manage (`enrollment:manage`)

| Method | Path |
| --- | --- |
| POST | `/enrollments` |
| PUT/PATCH | `/enrollments/:id` |
| DELETE | `/enrollments/:id` |
| POST | `/enrollments/:id/restore` |
| POST | `/enrollments/import/preview` |
| POST | `/enrollments/import` |
| POST | `/enrollments/bulk/enroll` |
| POST | `/enrollments/bulk/approve` |
| POST | `/enrollments/bulk/reject` |
| POST | `/enrollments/bulk/delete` |
| POST | `/enrollments/bulk/assign-faculty` |

## Query filters

`q`, `status`, `approvalStatus`, `completionStatus`, `enrollmentMethod`, `studentId`, `courseId`, `facultyId`, `departmentId`, `programId`, `academicYearId`, `semesterId`, `sectionId`, `includeDeleted`, `page`, `limit`, `sortBy`, `sortOrder`

## Domain events

`enrollment.created` · `enrollment.approved` · `enrollment.completed` · `enrollment.withdrawn` (+ updated/deleted/rejected/imported/exported)

Also emits `course.enrolled` when an enrollment becomes active.
