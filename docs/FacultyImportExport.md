# Faculty Import / Export

## Import

1. Upload CSV on `/institution/faculty/import`
2. Preview via `POST /faculty/import/preview`
3. Confirm via `POST /faculty/import`
4. Failures roll back created rows (hard delete)

### Required columns

`employeeId,facultyCode,firstName,lastName,email,designation,employmentType`

### Optional columns

`middleName,phone,departmentId,schoolId,campusId,academicYearId,semesterId,experienceYears,specialization,researchAreas,status,customDesignation`

### Audit

- `faculty.import.started`
- `faculty.import.completed`
- `faculty.imported`

## Export

`GET /faculty/export?format=csv|excel|pdf`

### Audit

- `faculty.export`
- `faculty.exported`

UI also supports Print on `/institution/faculty/export`.
