# Ownership

Ownership complements permissions — a user may hold `student:read` but still only access allowed rows.

## Middleware guards

| Guard | Purpose |
| --- | --- |
| `requireOwnership(paramKey)` | Resource user id matches JWT `sub`, or admin |
| `studentOwnershipGuard('id')` | Student role → own ERP `students` record only |
| `facultyStudentGuard('id')` | Faculty → students enrolled in supervised courses |
| `facultyCourseGuard('courseId')` | Faculty → assigned/coordinator courses |

Location: `backend/src/middlewares/scope.middleware.ts`.

## Service helpers

- `assertStudentSelfAccess` — student get/update by id
- `assertFacultySelfAccess` — faculty directory get
- `facultyCanAccessCourse` / `facultyCanAccessStudent` — point checks

## Query bypass

List filters ignore client attempts to widen scope:

- Students: `scopeStudentSelfFilter` forces `_id` / `studentId` to self
- Faculty: `buildFacultyCourseFilter`, `buildFacultyStudentFilter`
- Empty scope uses `{ $in: [] }` (zero results), never unrestricted `find()`

## Audit

Denied ownership checks emit `access.denied` audit events.
