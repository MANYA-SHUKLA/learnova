# Faculty Import / Export

## Import

1. Upload CSV on `/institution/faculty/import`
2. Client parses rows and calls `POST /faculty/import/preview`
3. Preview returns valid/invalid/duplicate counts + error report
4. Confirm with `POST /faculty/import` (`dryRun: false`)
5. On any failure after inserts begin, created rows are hard-deleted (rollback)

### Required CSV columns

`employeeId,facultyCode,firstName,lastName,email,designation,employmentType`

### Optional columns

`middleName,phone,departmentId,schoolId,campusId,experienceYears,specialization,researchAreas,status,customDesignation`

`researchAreas` uses `|` separators.

### Audit

- `faculty.import.started`
- `faculty.import.completed`

### Event

- `faculty.imported`

## Export

`GET /faculty/export?format=csv|excel|pdf`

- CSV: UTF-8 download
- Excel: Excel-compatible spreadsheet download
- PDF: lightweight text PDF
- UI also supports browser Print

### Audit

- `faculty.export`
