# Bookmarks

Learner bookmarks for Step **8.5**. Pin a published **module**, **lesson**, or **resource** inside an enrolled course. Overview: [Progress.md](./Progress.md).

## Model

| Field | Notes |
| --- | --- |
| `targetType` | `module` · `lesson` · `resource` |
| `courseId` | Required |
| `moduleId` / `lessonId` / `resourceId` | Required for matching `targetType` |
| `note` | Optional annotation (max 2000) |

Scoped by `institutionId` + `studentId`. Create requires active/approved enrollment.

## APIs

Base: `/api/v1`

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/progress/bookmarks` | `progress:read` |
| POST | `/progress/bookmarks` | `progress:write` |
| DELETE | `/progress/bookmarks/:id` | `progress:write` |

### Create body

```
courseId, targetType, moduleId? | lessonId? | resourceId?, note?
```

Validation: `module` → `moduleId`; `lesson` → `lessonId`; `resource` → `resourceId`.

### List query

`q` · `courseId` · `targetType` · `page` · `limit` · `sortBy` · `sortOrder`

Students only see own bookmarks. Delete is owner-scoped.

## Side effects

- Ensures course progress row exists
- Updates course `bookmarksCount`
- Activity `bookmark_created` + audit `bookmark_created` / `bookmark_deleted`
- Domain event `bookmark.created` on create

## UI route

`/student/bookmarks`

## Related docs

- [Progress.md](./Progress.md)
- [CourseProgress.md](./CourseProgress.md)
- [LessonProgress.md](./LessonProgress.md) — lesson notes (separate from bookmark `note`)
- [LearningActivity.md](./LearningActivity.md)
