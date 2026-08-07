# Learning Activity

Append-only learner activity feed for Step **8.5**. Records notable progress actions for dashboards and streaks. Overview: [Progress.md](./Progress.md).

## Event types

| Type | When |
| --- | --- |
| `course_started` | First learning action on a not-started course |
| `lesson_opened` | Lesson open |
| `lesson_completed` | Lesson newly completed |
| `module_completed` | Module newly rolled up to completed |
| `course_completed` | Course newly rolled up to completed |
| `resource_viewed` | Resource first marked viewed |
| `resource_downloaded` | Resource first marked downloaded |
| `bookmark_created` | Bookmark created |
| `note_created` | Note created |
| `session_started` | Learning session started |
| `session_ended` | Learning session ended (`durationSeconds` = active time) |

## Model

| Field | Notes |
| --- | --- |
| `type` | One of the event types above |
| `courseId` / `moduleId` / `lessonId` / `resourceId` | Optional context |
| `durationSeconds` | Used for sessions |
| `metadata` | Optional mixed payload |
| `occurredAt` | Event time (indexed) |

Collection: `learning_activities`. Not soft-deleted.

## API

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/progress/activity` | `progress:read` |

### Query

`courseId` · `studentId` (staff) · `type` · `page` · `limit` · `sortBy` · `sortOrder`

- **Student** — forced to own `studentId`
- **Faculty / admin** — optional `studentId` / `courseId` filters within tenant

## Consumers

- Student dashboard `recentActivity` + consecutive-day streak
- Faculty / institution analytics (engagement aggregates)
- UI route: `/student/activity`

## Audit (separate)

Progress also writes `progress_audit_logs` for lifecycle actions (`lesson_opened`, `lesson_completed`, `module_completed`, `course_completed`, session/bookmark/note events, `progress_updated`, `notes_exported`). Activity feed is the learner timeline; audit is the compliance trail.

## Related docs

- [Progress.md](./Progress.md)
- [CourseProgress.md](./CourseProgress.md)
- [LessonProgress.md](./LessonProgress.md)
- [Bookmarks.md](./Bookmarks.md)
