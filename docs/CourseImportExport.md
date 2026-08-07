# Course Import / Export

## Import

1. Upload CSV on `/institution/courses/import`
2. Preview via `POST /courses/import/preview`
3. Confirm via `POST /courses/import`
4. Failures roll back created rows (hard delete)

### Required columns

`courseCode,slug,title`

### Optional columns

`subtitle,description,shortDescription,departmentId,campusId,schoolId,programIds,semesterIds,facultyIds,coordinatorId,category,difficulty,language,credits,estimatedHours,duration,status,visibility,tags,learningObjectives,prerequisites,requirements,outcomes,skills,maxStudents,enrollmentMode,seoTitle,seoDescription,seoKeywords`

Array fields accept comma-separated values.

### Duplicate detection

Rows conflicting on `courseCode` or `slug` (within file or existing DB) are reported in the preview error list.

### Audit

- `course.imported`

## Export

`GET /courses/export?format=csv|excel|pdf`

Supports the same filters as list (`status`, department, program, semester, faculty, category, difficulty, etc.).

### Audit

- `course.exported`

UI also supports Print on `/institution/courses/export`.
