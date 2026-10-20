# Student Import / Export

## Import

1. Upload CSV on `/institution/students/import`
2. Preview via `POST /students/import/preview`
3. Confirm via `POST /students/import`
4. Failures roll back created rows (hard delete) **and** provisioned login users

Each successful row runs the normal **create** path:

- Login user provisioned with random temporary password
- `mustChangePassword: true`
- Credentials emailed via SMTP to the student email
- Response includes `credentialsEmailed` count

### Required columns

`studentId,admissionNumber,firstName,lastName,email`

### Optional columns

`rollNumber,registrationNumber,middleName,phone,campusId,schoolId,departmentId,programId,programCode,academicYearId,academicYearName,semesterId,semesterName,sectionId,sectionName,batchId,batchName,yearOfStudy,currentSemester,admissionDate,status,scholarship,hostelResident,transportRequired,guardianName,guardianPhone`

Human-readable columns (`sectionName`, `programCode`, `semesterName`, `academicYearName`, `batchName`) are matched case-insensitively within the institution. When `sectionName` or `semesterId` is set, `programId`, `semesterId`, `academicYearId`, `yearOfStudy`, and `currentSemester` are filled automatically when omitted.

### Duplicate detection

Rows conflicting on `studentId`, `admissionNumber`, or `email` (within file or existing DB) are reported in the preview error list.

### Audit

- `student.import.started`
- `student.import.completed` (metadata includes `credentialsEmailed`)
- `student.imported`

## Export

`GET /students/export?format=csv|excel|pdf`

Supports the same filters as list (`status`, campus/school/department/program/section/batch, scholarship, etc.).

### Audit

- `student.export`
- `student.exported`

UI also supports Print on `/institution/students/export`.
