# Examination API

Base path: `/api/v1/examinations`

Permissions: `examination:read` · `examination:write` · `examination:manage` · `examination:proctor`

## Exams

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/examinations` | read | List exams |
| POST | `/examinations` | write | Create exam |
| GET | `/examinations/:id` | read | Get exam |
| PATCH | `/examinations/:id` | write | Update exam |
| DELETE | `/examinations/:id` | write | Soft delete |
| POST | `/examinations/:id/publish` | write | Publish |
| POST | `/examinations/:id/schedule` | write | Mark scheduled |
| POST | `/examinations/:id/cancel` | write | Cancel |
| POST | `/examinations/:id/archive` | write | Archive |
| POST | `/examinations/:id/duplicate` | write | Duplicate |
| POST | `/examinations/bulk` | write | Bulk actions |
| GET | `/examinations/:id/analytics` | read | Per-exam analytics (reuses Assessment Core helpers) |

## Seating & check-in

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/examinations/seating/assign` | write |
| GET | `/examinations/:id/seating` | read |
| POST | `/examinations/check-in` | write |

## Attempts (uses assessmentQuestionEngine)

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/examinations/attempts/start` | write |
| POST | `/examinations/attempts/:id/answers` | write |
| POST | `/examinations/attempts/submit` | write |
| GET | `/examinations/attempts/:id` | read |
| GET | `/examinations/attempts` | read |

## Dashboards

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/examinations/dashboard/faculty` | read |
| GET | `/examinations/dashboard/student` | read |
| GET | `/examinations/dashboard/institution` | manage |

| GET | `/examinations/:id/live` | proctor | Live monitoring snapshot |
| GET | `/examinations/:id/violations` | read | Violation list |
| GET | `/examinations/:id/attendance` | read | Attendance list |
| GET | `/examinations/policies` | read | Policy templates |
| POST | `/examinations/policies` | write | Create policy template |
| POST | `/examinations/attempts/:id/violations` | write | Student reports violation (secure browser) |

See [ExamProctoring.md](./ExamProctoring.md) for proctor endpoints. See [LiveMonitoring.md](./LiveMonitoring.md) for Socket.IO events.
