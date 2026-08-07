# Enrollment Import / Export

## Import

1. Upload CSV on `/institution/enrollments/import`
2. Preview via `POST /enrollments/import/preview`
3. Confirm via `POST /enrollments/import`
4. Failures roll back created rows (hard delete)

### Required columns

`studentId,courseId`

### Optional columns

`departmentId,programId,academicYearId,semesterId,sectionId,facultyId,status,enrollmentMethod,notes,enrollmentDate`

### Duplicate detection

Existing active enrollment for same student + course (within institution) is rejected.

### Audit

`enrollment.imported`

## Export

`GET /enrollments/export?format=csv|excel|pdf`

Supports the same filters as list.

### Audit

`enrollment.exported`

UI print support on `/institution/enrollments/export`.
