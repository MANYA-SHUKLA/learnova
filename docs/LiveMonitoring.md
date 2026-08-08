# Live Exam Monitoring

Real-time faculty dashboard for proctored exams using **Socket.IO** (`/exam` namespace) and REST snapshot polling.

## Routes

| Surface | Path |
| --- | --- |
| UI | `/faculty/exams/live` |
| API | `GET /api/v1/examinations/:id/live` |

Permission: `examination:proctor`

## Socket.IO

Namespace: `/exam` (see `backend/src/socket/exam.namespace.ts`)

| Client emit | Purpose |
| --- | --- |
| `join.exam` | Faculty joins exam monitoring room |
| `join.attempt` | Student joins attempt room (countdown) |
| `leave.exam` / `leave.attempt` | Cleanup |

| Server emit | Payload |
| --- | --- |
| `live.attempt.updated` | attempt status, studentId |
| `live.violation.recorded` | violationType, violationCount |
| `live.attempt.submitted` | score, passed |
| `live.countdown` | remainingSeconds |

## Live snapshot

`GET /examinations/:id/live` returns:

- `stats`: online, started, submitted, disconnected, warnings, violations
- `attempts`: recent attempt rows
- `recentViolations`: latest `ExamViolation` records

Frontend: `useLiveMonitoringQuery` (10s poll) + `useExamSocket` (push updates).

## Faculty dashboard widgets

- Students online / started / submitted
- Disconnected count
- Warning & violation totals
- Recent violation feed
- Per-attempt status list

See [ExamAPI.md](./ExamAPI.md) · [ExamProctoring.md](./ExamProctoring.md)
