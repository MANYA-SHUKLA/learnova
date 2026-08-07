# Progress Tracking

Enterprise LMS learner journey layer (Step **8.5**). Tracks how enrolled students move through published course content — not grades, labs, or certificates.

```
Enrollment → Course Progress → Module Progress → Lesson Progress → Resource Progress
```

Requires an **active** or **approved** enrollment. Progress rolls up from completed published lessons into modules and courses, and can mark the enrollment `completed` when the course finishes.

## Capabilities

- Course / module / lesson / resource progress with rollup
- Open · update · complete lessons (watch % · reading % · last position)
- Resume position (scroll · video · markdown · last resource)
- Learning sessions (start / end · idle vs active time)
- Bookmarks (module · lesson · resource) + lesson notes (+ CSV/JSON export)
- Learning activity feed
- Role dashboards: student · faculty (per course) · institution
- Search, filters, stats
- Audit trail + domain events
- Seed from enrollments + published builder content

## Hierarchy rules

1. **Enrollment gate** — write paths require `status ∈ {active, approved}` for that student/course.
2. **Published content only** — rollup counts modules/lessons with `status: published` and `deletedAt: null`.
3. **Lesson complete when** watch% ≥ 100 **or** reading% ≥ 100 **or** manual complete.
4. **Module %** = completed published lessons in module / total published lessons in module.
5. **Course %** = completed published lessons / total published lessons (falls back to modules if no lessons).
6. **Status** — `not_started` · `in_progress` · `completed` · `paused` (paused reserved; rollup derives the first three).
7. **Enrollment sync** — first progress sets enrollment `completionStatus: in_progress`; full course completion sets enrollment `status` + `completionStatus: completed` and `completionDate`.

## Learning status

`not_started` · `in_progress` · `completed` · `paused`

## Permissions

| Permission | Use |
| --- | --- |
| `progress:read` | Own / scoped progress, resume, bookmarks, notes, activity, dashboards, stats, search |
| `progress:write` | Open/update/complete lessons, resource progress, sessions, bookmarks, notes |
| `progress:manage` | Institution-wide progress analytics |

| Role | Access |
| --- | --- |
| Student | Own progress (matched by student email + institution) |
| Faculty | Read/write analytics on assigned / coordinated courses (`courseId` required for faculty dashboard) |
| Institution Admin | Full tenant progress + institution dashboard |

## API base

`/api/v1/progress/...` — see related docs for endpoint groups.

## UI routes

| Route | Audience |
| --- | --- |
| `/student/progress` | Continue learning + course list |
| `/student/progress/course/:id` | Course outline progress |
| `/student/bookmarks` | Bookmarks |
| `/student/notes` | Notes |
| `/student/activity` | Activity feed |
| `/faculty/progress` | Per-course learner analytics |
| `/institution/progress` | Institution engagement analytics |

## Out of scope

Practice labs · projects · assignments · quizzes · exams · gradebook · attendance · certificates · AI · content authoring (Step **7.5**) · enrollment lifecycle (Step **8**)

## Seed

```bash
pnpm --filter @learnova/backend seed:auth        # progress permissions
pnpm --filter @learnova/backend seed:enrollments # prerequisite
pnpm --filter @learnova/backend seed:progress
```

Uses `SEED_INSTITUTION_ID`. Seeds up to 500 enrollments with course/module/lesson progress, bookmarks, notes, and activities. Set `SEED_FORCE=1` to replace.

## Definition of done (met)

- [x] Models + APIs for course/module/lesson/resource progress, bookmarks, notes, sessions, activity
- [x] Enrollment-gated writes + published-content rollup
- [x] Permissions (`progress:read|write|manage`) + role scoping
- [x] Audit + domain events
- [x] Dashboards (student / faculty / institution) + seed + tests
- [x] Docs for Progress / CourseProgress / LessonProgress / Bookmarks / LearningActivity

## Related docs

- [CourseProgress.md](./CourseProgress.md)
- [LessonProgress.md](./LessonProgress.md)
- [Bookmarks.md](./Bookmarks.md)
- [LearningActivity.md](./LearningActivity.md)
- [Enrollment.md](./Enrollment.md) — prerequisite source of truth
- [CourseBuilder.md](./CourseBuilder.md) — published modules / lessons / resources
- [Roadmap.md](./Roadmap.md)
