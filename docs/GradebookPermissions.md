# Gradebook Permissions

| Permission | Roles | Capabilities |
| --- | --- | --- |
| `gradebook:read` | student, faculty, institution_admin | List entries, summaries, dashboards |
| `gradebook:write` | faculty, institution_admin | Sync, ingest, assign project grades, weight schemes |
| `gradebook:manage` | institution_admin | Finalize course grades, institution dashboard |

## Scoping rules

### Students

- Resolved by actor email → `Student` record
- May only read own entries and summaries
- Cannot sync, ingest, or finalize

### Faculty / teaching assistants

- Must be assigned to course (`facultyIds` or `coordinatorId`)
- May sync and assign project grades for assigned courses
- Faculty dashboard requires `courseId` query parameter

### Institution admins

- Full tenant access
- May finalize course grade summaries
- Institution dashboard supports optional `courseId` filter

## Route mapping

| Operation | Permission |
| --- | --- |
| List / get entries & summaries | `gradebook:read` |
| Weight scheme read | `gradebook:read` |
| Sync, ingest, project grade, weight scheme write | `gradebook:write` |
| Finalize, institution dashboard | `gradebook:manage` |

See [AccessModel](./AccessModel.md) for the global RBAC model.
