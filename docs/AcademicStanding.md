# Academic standing (Step 14)

Standing is computed from **published** gradebook summaries only — never from raw assessment attempts.

## Standing types

| Value | Meaning |
| --- | --- |
| `good_standing` | Meets minimum GPA thresholds |
| `academic_warning` | Below warning GPA |
| `probation` | Below probation GPA or repeated failures |
| `failed_semester` | Too many failed courses |
| `honors` | High semester/CGPA |
| `distinction` | Top tier GPA |

Thresholds are configurable via **Academic Policy** (`GET/PUT /api/v1/gradebook/policy`).

## API

| Method | Path |
| --- | --- |
| `POST` | `/api/v1/gradebook/standing/compute` |
| `GET` | `/api/v1/gradebook/standing` |

## Events

- `grade.standing.computed` — batch recompute finished
- `standing.updated` — per-student standing saved

## Frontend

- Institution: `/institution/standing`
- Student: `/student/academic-standing`

See [GradebookPolicies.md](./GradebookPolicies.md) for threshold configuration.
