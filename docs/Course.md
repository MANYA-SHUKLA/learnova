# Course Management

Enterprise LMS course catalog module (Step 7). Manages course metadata, academic mapping, faculty assignment, lifecycle, import/export, and analytics — not lesson content.

## Capabilities

- CRUD with soft delete (archive / restore)
- Lifecycle: draft · review · published · scheduled · archived
- Publish · unpublish · archive · duplicate
- Search, filters, pagination, sorting
- Bulk publish / unpublish / archive / delete / status / assign faculty / programs / semesters
- CSV import with preview + rollback
- CSV / Excel / PDF export
- Thumbnail upload / replace / remove
- Academic mapping: institution, campus, school, department, programs, semesters
- Faculty assignment + coordinator
- Enrollment settings (max students, mode, waitlist flags on model)
- Audit trail + domain events
- Role-based permissions with faculty scoping to own/assigned courses

## Out of scope (later steps)

Lessons · modules · videos · assignments · projects · labs · exams · grades · attendance · certificates · AI

## UI routes

| Route | Purpose |
| --- | --- |
| `/institution/courses` | Dashboard widgets + directory |
| `/institution/courses/create` | Create |
| `/institution/courses/:id` | Detail / overview |
| `/institution/courses/:id/edit` | Edit |
| `/institution/courses/import` | CSV import |
| `/institution/courses/export` | Export center |

## Status values

`draft` · `review` · `published` · `scheduled` · `archived`

## Visibility

`private` · `institution` · `public` · `invite_only`

## Difficulty

`beginner` · `intermediate` · `advanced` · `expert`

## Category

`programming` · `cyber_security` · `ai` · `cloud` · `networking` · `database` · `electronics` · `mechanical` · `mathematics` · `general` · `custom`

## Seed

```bash
pnpm --filter @learnova/backend seed:courses
```

Generates at least 30 courses across departments, programs, semesters, and faculty with mixed statuses. Set `SEED_INSTITUTION_ID` and related ref IDs via env.

## Related docs

- [CourseAPI.md](./CourseAPI.md)
- [CoursePermissions.md](./CoursePermissions.md)
- [CourseImportExport.md](./CourseImportExport.md)
- [CourseDashboard.md](./CourseDashboard.md)
