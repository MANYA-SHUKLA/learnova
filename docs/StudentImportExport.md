# Student Import / Export

## Import

1. Upload CSV on `/institution/students/import`
2. Preview via `POST /students/import/preview`
3. Confirm via `POST /students/import`
4. Failures roll back created rows (hard delete)

### Required columns

`studentId,admissionNumber,firstName,lastName,email`

### Optional columns

`rollNumber,registrationNumber,middleName,phone,campusId,schoolId,departmentId,programId,academicYearId,semesterId,sectionId,batchId,yearOfStudy,currentSemester,admissionDate,status,scholarship,hostelResident,transportRequired,guardianName,guardianPhone`

### Duplicate detection

Rows conflicting on `studentId`, `admissionNumber`, or `email` (within file or existing DB) are reported in the preview error list.

### Audit

- `student.import.started`
- `student.import.completed`
- `student.imported`

## Export

`GET /students/export?format=csv|excel|pdf`

Supports the same filters as list (`status`, campus/school/department/program/section/batch, scholarship, etc.).

### Audit

- `student.export`
- `student.exported`

UI also supports Print on `/institution/students/export`.
