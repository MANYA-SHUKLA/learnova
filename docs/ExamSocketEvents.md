# Exam Socket.IO events (Step 13)

Namespace: **`/exam`**

## Rooms

| Room | Members |
| --- | --- |
| `exam:{examId}` | Faculty monitors, institution admins |
| `attempt:{attemptId}` | Student taking that attempt |

## Client → server

| Event | Payload | Action |
| --- | --- | --- |
| `join.exam` / `exam.join` | `examId` | Join exam room |
| `leave.exam` / `exam.leave` | `examId` | Leave exam room |
| `join.attempt` / `attempt.started` | `attemptId` | Join attempt room |

## Server → client

| Event | Payload (typical) |
| --- | --- |
| `live.attempt.updated` | `{ stats?, attemptId? }` |
| `live.attempt.started` | `{ attemptId, examId }` |
| `live.attempt.submitted` | `{ attemptId, examId }` |
| `live.attempt.disconnected` | `{ attemptId, examId }` |
| `live.student.reconnected` | `{ attemptId, examId }` |
| `live.violation.recorded` | `{ violationType, violationCount? }` |
| `live.announcement` | `{ id, title, message, announcementType, isEmergency }` |
| `live.attendance.updated` | *(reserved)* |
| `live.countdown` | `{ remainingSeconds }` |

## Implementation

- Registration: `backend/src/socket/exam.namespace.ts`
- Emit helpers: `backend/src/socket/exam-live.ts`
- Frontend hook: `frontend/src/features/examination/hooks/use-exam-socket.ts`

Assessment Core (question engine, scoring) is **never** invoked from socket handlers — only exam orchestration and monitoring.
