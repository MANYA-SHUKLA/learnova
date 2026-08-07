# Enrollment Management

Enterprise LMS relationship layer (Step **8**). Connects students to courses with academic mapping, approval, waitlist, and bulk ops.

```
Student → Enrollment → Course → Faculty → Program → Semester
```

## Capabilities

- CRUD with soft delete (restore)
- Manual · bulk · self · invite · API enrollment methods
- Approval flow (pending → approve / reject)
- Withdraw · complete
- Self-enrollment respects course `enrollmentMode`, `maxStudents`, `enrollmentDeadline`, `waitlistEnabled`
- Waitlist join / leave / auto-promote
- Search, filters, sort, pagination
- Bulk enroll / approve / reject / delete / assign faculty
- CSV import (preview + rollback) · CSV / Excel / PDF export
- Role-scoped dashboards: institution · faculty · student
- Audit trail + domain events

## Out of scope

Progress tracking · labs · assignments · quizzes · exams · certificates · attendance · gradebook · AI

## UI routes

| Route | Audience |
| --- | --- |
| `/institution/enrollments` | Admin directory + stats |
| `/institution/enrollments/create` | Manual enroll |
| `/institution/enrollments/:id` | Detail + actions |
| `/institution/enrollments/import` | CSV import |
| `/institution/enrollments/export` | Export center |
| `/faculty/enrollments` | Assigned-course enrollments + approvals |
| `/student/enrollments` | Own enrollments, self-enroll, waitlist |

## Status

`pending` · `approved` · `rejected` · `active` · `completed` · `withdrawn` · `dropped` · `expired`

## Completion status

`not_started` · `in_progress` · `completed`

## Seed

```bash
pnpm --filter @learnova/backend seed:auth   # enrollment permissions
pnpm --filter @learnova/backend seed:enrollments
```

Uses `SEED_INSTITUTION_ID`. Generates 1000+ enrollments across students/courses.

## Integration checkpoint (Step 8.25)

Before Progress Tracking (8.5), verify:

1. Course enrollment rules (open · approval · invite-only · closed · waitlist · deadline)
2. Role flows (Institution Admin · Faculty · Student)
3. Dashboard / enrollment counts stay consistent after enroll · approve · withdraw · complete
4. Audit logs and domain events for every lifecycle action

See [Roadmap.md](./Roadmap.md#step-825--enrollment-integration-checkpoint) and [EnrollmentWorkflow.md](./EnrollmentWorkflow.md).

## Related docs

- [EnrollmentAPI.md](./EnrollmentAPI.md)
- [EnrollmentPermissions.md](./EnrollmentPermissions.md)
- [EnrollmentImportExport.md](./EnrollmentImportExport.md)
- [EnrollmentWorkflow.md](./EnrollmentWorkflow.md)
