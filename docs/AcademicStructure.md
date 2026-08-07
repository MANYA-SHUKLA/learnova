# Academic Structure

Canonical ERP hierarchy under an institution. Faculty and Students attach after Batch in the operational spine (Steps 5–6). Courses / enrollments start only after Step 6.5.

## ERP spine

```
Institution
  ↓
Campus
  ↓
School
  ↓
Department
  ↓
Program
  ↓
Academic Year
  ↓
Semester
  ↓
Section
  ↓
Batch
  ↓
Faculty
  ↓
Students
```

## Structural tree (parents & children)

```
Institution
 ├─ Campus (multi-campus)
 ├─ School
 │   └─ Department
 │       └─ Program
 │           ├─ Section (program + semester + capacity)
 │           └─ Batch (intake year)
 ├─ Academic Year
 │   ├─ Semester (odd / even / summer)
 │   └─ Academic Calendar (events)
 ├─ Faculty (campus / school / department / programs)
 ├─ Students (campus → … → batch + academic assignments)
 └─ Institution Settings
```

## Collections

| Collection | Parent keys |
| --- | --- |
| `campuses` | `institutionId` |
| `schools` | `institutionId` |
| `departments` | `institutionId`, `schoolId` |
| `programs` | `institutionId`, `departmentId` |
| `academic_years` | `institutionId` |
| `semesters` | `institutionId`, `academicYearId` |
| `sections` | `institutionId`, `programId`, `semesterId` |
| `batches` | `institutionId`, `programId` |
| `academic_calendars` | `institutionId`, `academicYearId` |
| `faculty` | `institutionId`, optional campus/school/department/program/year/semester |
| `students` | `institutionId`, optional campus → batch + year/semester/section |

## Entity notes

### Campus
Multi-location support: name, code, address, city, state, country, phone, email, status.

### School
Examples: Engineering, Management, Law, Medicine.

### Department
Examples: CSE, IT, Mechanical, Cyber Security, AI, Data Science. Belongs to a school.

### Program
Examples: B.Tech, M.Tech, MBA, MCA, BCA, PhD. Fields: durationYears, credits, level (`certificate`…`doctoral`).

### Academic year
Named ranges such as `2025-2026` with start/end dates and `isActive` (only one active per tenant when set).

### Semester
Numbered terms with `odd` \| `even` \| `summer`.

### Section
Named capacity groups (A/B/C…) for a program + semester.

### Batch
Intake years (2023, 2024, …) tied to a program.

### Academic calendar
Named calendar per academic year with events:

- `semester_start`, `semester_end`
- `exam_start`, `exam_end`
- `holiday`, `event`

## Soft delete

All tenant resources support soft delete (`deletedAt` + status `archived`) and `POST /:id/restore`.

## List API behavior

Shared query: `q`, `status`, `includeDeleted`, relation filters (`schoolId`, `departmentId`, `programId`, `academicYearId`, `semesterId`), `page`, `limit`, `sortBy`, `sortOrder`.

## UI routes

| Path | Module |
| --- | --- |
| `/institution/campuses` | Campuses |
| `/institution/schools` | Schools |
| `/institution/departments` | Departments |
| `/institution/programs` | Programs |
| `/institution/academic-years` | Academic years |
| `/institution/semesters` | Semesters |
| `/institution/sections` | Sections |
| `/institution/batches` | Batches |
| `/institution/calendar` | Academic calendars |

## Audit highlights

- `department.created` / `department.updated`
- `program.created`
- `semester.created`
- `calendar.updated`
- Plus entity archive/restore events
