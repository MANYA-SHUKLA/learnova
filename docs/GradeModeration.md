# Grade Moderation Workflow

Enterprise grade publication follows a three-stage moderation pipeline with full audit history.

## Stages

1. **Faculty submit** (`faculty_submitted`) — syncs course gradebook and marks summaries for department review
2. **Department approve** (`department_approved`) — institution admin / HOD proxy approves submitted grades
3. **Institution publish** (`institution_published`) — creates immutable snapshots and publishes grades to students

Each transition writes a `GradeModerationRecord` and audit log entry.

## API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/v1/gradebook/moderation/submit` | `gradebook:write` |
| POST | `/api/v1/gradebook/moderation/approve` | `gradebook:manage` |
| POST | `/api/v1/gradebook/moderation/publish` | `gradebook:manage` |
| GET | `/api/v1/gradebook/moderation/:courseId/timeline` | `gradebook:read` |

Body for actions: `{ courseId, notes? }`

## Events

- `grade.moderation.submitted`
- `grade.moderation.department_approved`
- `grade.moderation.published`
