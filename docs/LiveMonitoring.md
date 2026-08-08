# Live exam monitoring (Step 13)

Faculty live monitor: **`/faculty/exams/live`** (alias under `/faculty/examinations`).

## Data sources

- **REST:** `GET /api/v1/examinations/:id/live` — stats (online, started, submitted, disconnected, warnings, violations), recent attempts, recent violations. Polled every 10s from the frontend.
- **Socket.IO:** namespace `/exam`, room `exam:{examId}`

## Socket events (server → client)

| Event | When |
| --- | --- |
| `live.attempt.updated` | Check-in, attempt state change |
| `live.attempt.started` | Attempt started |
| `live.attempt.submitted` | Submit |
| `live.attempt.disconnected` | Heartbeat reports offline |
| `live.student.reconnected` | Heartbeat after disconnect |
| `live.violation.recorded` | Student or proctor violation |
| `live.announcement` | Faculty broadcast |
| `live.countdown` | Remaining seconds on start |

## Client join events

Both legacy and spec names are supported:

- `join.exam` / `exam.join`
- `join.attempt` / `attempt.started`

## Proctoring console

`/faculty/proctoring` lists in-progress exams and links to the live monitor per exam.

See [ExamSocketEvents.md](./ExamSocketEvents.md) for the full event catalog.
