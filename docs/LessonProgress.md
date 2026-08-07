# Lesson Progress

Per-lesson learning state for Step **8.5**. Parent rollup: [CourseProgress.md](./CourseProgress.md). Overview: [Progress.md](./Progress.md).

Unique on `(studentId, lessonId)`. Always scoped by `institutionId`, `courseId`, and `moduleId`.

## Fields

| Field | Notes |
| --- | --- |
| `status` | `not_started` · `in_progress` · `completed` · `paused` |
| `watchPercentage` | 0–100 (video / media) |
| `readingPercentage` | 0–100 (text / scroll) |
| `timeSpentSeconds` | Additive across updates |
| `completed` / `completedAt` | True when completion rule met |
| `lastPosition` | Numeric resume hint |
| `lastAccessedAt` | Updated on open / progress |
| `visitCount` | Incremented on open |

## Completion rule

A lesson is complete when **any** of:

- `watchPercentage >= 100`
- `readingPercentage >= 100`
- Manual complete (`POST /progress/lessons/complete`)

## APIs

Base: `/api/v1` — all writes need `progress:write` + active/approved enrollment.

| Method | Path | Body |
| --- | --- | --- |
| POST | `/progress/lessons/open` | `courseId`, `moduleId`, `lessonId`, optional `position` |
| PATCH | `/progress/lessons` | `courseId`, `moduleId`, `lessonId`, optional `watchPercentage`, `readingPercentage`, `lastPosition`, `timeSpentSeconds`, `resumePosition` |
| POST | `/progress/lessons/complete` | `courseId`, `moduleId`, `lessonId`, optional `watchPercentage`, `readingPercentage` |
| GET | `/progress/resume/:courseId` | — |

### Open lesson

- Upserts lesson progress → `in_progress` (keeps `completed` if already done)
- Increments `visitCount`, sets `lastAccessedAt` / optional `lastPosition`
- Ensures course progress row exists
- Emits `course_started` activity the first time course leaves `not_started`
- Emits `lesson_opened` activity + audit
- Runs course/module rollup; stores resume (`scrollY` from `position` when provided)

### Update lesson

- Merges watch/reading/position/time
- Auto-completes when percentages hit 100
- On first completion: `lesson_completed` activity + audit + `lesson.completed` event
- Optional `resumePosition` written onto course progress
- Rollup after save

### Complete lesson

- Forces completion (defaults missing percentages to 100)
- Same completion side effects + rollup as update

### Resume

Returns `currentModuleId`, `currentLessonId`, `resumePosition`, `progressPercentage`, `status`, `lastAccessedAt` for the enrolled student.

## Learning sessions

| Method | Path | Body |
| --- | --- | --- |
| POST | `/progress/sessions/start` | `courseId`, optional `lessonId` |
| POST | `/progress/sessions/end` | `sessionId`, `idleSeconds`, optional `activeSeconds` |

End computes elapsed time, records idle/active/total seconds, emits `session_ended` activity, and adds **active** minutes into course `timeSpentMinutes` via rollup.

## Lesson notes

Lesson-scoped text notes (`learning_notes`):

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/progress/notes` | `progress:read` |
| POST | `/progress/notes` | `progress:write` |
| PATCH | `/progress/notes/:id` | `progress:write` |
| DELETE | `/progress/notes/:id` | `progress:write` |
| GET | `/progress/notes/export?format=csv\|json` | `progress:read` |

Create body: `courseId`, `lessonId`, `text` (max 20_000). Updates course `notesCount`. Emits `note_created` activity + `note.created` event.

## Domain events

`lesson.completed` · `progress.updated` · `course.progress.updated` · `module.completed` · `course.completed` · `note.created`

## Related docs

- [Progress.md](./Progress.md)
- [CourseProgress.md](./CourseProgress.md)
- [Bookmarks.md](./Bookmarks.md)
- [LearningActivity.md](./LearningActivity.md)
