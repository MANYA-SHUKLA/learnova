# Course Progress

Course-, module-, and resource-level progress for Step **8.5**. Lesson open/complete/resume details live in [LessonProgress.md](./LessonProgress.md). Overview: [Progress.md](./Progress.md).

```
Course Progress
  ↓
Module Progress
  ↓
Lesson Progress
  ↓
Resource Progress
```

One **course progress** row per `(institutionId, studentId, courseId)`, linked to `enrollmentId`.

## Course progress fields

| Field | Notes |
| --- | --- |
| `progressPercentage` | 0–100 from published lesson completion (or modules if no lessons) |
| `status` | `not_started` · `in_progress` · `completed` · `paused` |
| `startedAt` / `lastAccessedAt` / `completedAt` | Lifecycle timestamps |
| `timeSpentMinutes` | Accumulated from sessions + lesson updates |
| `estimatedRemainingMinutes` | From content `estimatedMinutes` × remaining % |
| `currentModuleId` / `currentLessonId` | Resume pointers |
| `resumePosition` | `scrollY` · `videoSeconds` · `markdownOffset` · `lastResourceId` |
| `bookmarksCount` / `notesCount` | Denormalized counters |

## Module progress

| Field | Notes |
| --- | --- |
| `completionPercentage` | Completed published lessons / total in module |
| `status` | Derived from lesson completions / visits |
| `timeSpentMinutes` | Module-level time (when tracked) |
| `startedAt` / `completedAt` / `lastAccessedAt` | |

Unique on `(institutionId, studentId, moduleId)`. Rollup emits `module_completed` activity + audit + `module.completed` event the first time a module reaches 100%.

## Resource progress

Per student/resource:

| Field | Notes |
| --- | --- |
| `viewed` / `downloaded` / `completed` | Flags |
| `timeSpentSeconds` | Additive |
| `status` | `not_started` → `in_progress` (view/download/time) → `completed` |

Does **not** drive course % by itself — lesson completion does. Emits `resource_viewed` / `resource_downloaded` activities on first transition.

## APIs

Base: `/api/v1`

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/progress/me` | `progress:read` |
| GET | `/progress/course/:courseId` | `progress:read` |
| GET | `/progress/resume/:courseId` | `progress:read` |
| POST | `/progress/resources` | `progress:write` |
| GET | `/progress/dashboard/student` | `progress:read` |
| GET | `/progress/dashboard/faculty?courseId=` | `progress:read` |
| GET | `/progress/dashboard/institution` | `progress:manage` |
| GET | `/progress/stats` | `progress:read` |
| GET | `/progress/search` | `progress:read` |

`GET /progress/course/:courseId` returns course progress plus published modules/lessons with nested progress. Requires active/approved enrollment.

### List query (`/progress/me`)

`q` · `status` · `courseId` · `studentId` (staff) · `bookmarked` · `recent` · `page` · `limit` · `sortBy` · `sortOrder`

### Resource body

`courseId` · `lessonId` · `resourceId` · optional `viewed` · `downloaded` · `completed` · `timeSpentSeconds`

## Rollup behavior

Triggered after lesson open / update / complete and session end:

1. Recompute each published module’s completion % and status
2. Recompute course % and status
3. Update resume pointers / remaining minutes / time
4. Audit `progress_updated`; emit `progress.updated` + `course.progress.updated`
5. On first course completion: activity + audit + `course.completed`, and mark enrollment completed

## Domain events

`progress.updated` · `course.progress.updated` · `module.completed` · `course.completed`

## Related docs

- [Progress.md](./Progress.md)
- [LessonProgress.md](./LessonProgress.md)
- [Bookmarks.md](./Bookmarks.md)
- [LearningActivity.md](./LearningActivity.md)
