# Gradebook Reports

## Report types

| Type | Scope |
| --- | --- |
| `student` | Single student across courses |
| `course` | All students in a course |
| `department` | Department filter (via enrollment) |
| `semester` | Semester rollup |
| `program` | Program filter |
| `institution` | Institution-wide |

## API

`GET /api/v1/gradebook/reports?type=course&courseId=...&format=json|csv`

CSV export sets `Content-Disposition: attachment; filename=gradebook-export.csv`.

## Summary metrics

- Total records
- Pass rate
- Grade distribution (letter counts)
- Average percentage

## Course matrix

`GET /api/v1/gradebook/courses/:courseId/matrix` — students × activity columns with consumed entry marks.

## Dashboards

- Institution: pass rate, grade distribution, pending appeals
- Faculty: pending projects, locked/published counts
- Student: GPA, CGPA, semester results
