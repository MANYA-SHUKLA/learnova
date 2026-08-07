# Course Builder

Enterprise Course Builder & Content Management (Step **7.5**).

The Course Catalog (Step 7) is the **container**. This module builds everything **inside** the course:

```
Course → Modules → Lessons → Resources
```

## Out of scope

Practice labs · projects · assignments · quizzes · exams · certificates · AI · gradebook · attendance · progress analytics · enrollments

## UI route

`/institution/courses/:courseId/builder`

Layout: left module sidebar · center lesson editor · right lesson properties.

## Capabilities

- Module / lesson / resource CRUD (soft delete, archive, restore, duplicate)
- Drag-and-drop reorder (modules, lessons; move lessons via API)
- TipTap rich-text content editor
- Debounced autosave + dirty indicator
- Resource attach (URL / upload)
- Lesson version history (view snapshots; restore deferred)
- Search & filters in builder sidebar
- Permissions: `course:write` required (students blocked)
- Faculty scoped to assigned / coordinated courses
- Audit + domain events

## Seed

```bash
pnpm --filter @learnova/backend seed:course-builder
```

Targets ~30 courses · 120 modules · 600 lessons (+ resources). Uses `SEED_INSTITUTION_ID`.

## Related docs

- [Modules.md](./Modules.md)
- [Lessons.md](./Lessons.md)
- [Resources.md](./Resources.md)
- [BuilderPermissions.md](./BuilderPermissions.md)
- [Course.md](./Course.md) — frozen catalog
