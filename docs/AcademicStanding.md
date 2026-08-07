# Academic Standing

Academic standing is derived from published course grades, semester GPA, CGPA, and institutional thresholds configured in the academic policy.

## Standing types

- `good_standing`
- `academic_warning`
- `probation`
- `failed_semester`
- `honors`
- `distinction`

Thresholds (`probationGpa`, `warningGpa`, `honorsGpa`, `distinctionGpa`, `failedCourseLimit`) are configurable per institution.

## API

- `POST /api/v1/gradebook/standing/compute` — recompute standing for published grades (`gradebook:write`)
- `GET /api/v1/gradebook/standing?studentId=&semesterId=` — list standing records (`gradebook:read`)

Students automatically receive only their own standing records.

## Event

- `grade.standing.computed`
