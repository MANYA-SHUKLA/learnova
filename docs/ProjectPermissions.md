# Project Permissions

Enterprise project management uses three permission keys scoped by role and enrollment.

## Permission keys

| Permission | Description |
| --- | --- |
| `project:read` | View projects, teams, submissions, comments, reviews, grades |
| `project:write` | Create/update own work: teams, submissions, peer reviews; faculty grade & approve teams |
| `project:manage` | Institution-wide CRUD, bulk ops, assign faculty, analytics |

## Role matrix

| Action | student | faculty | institution_admin | teaching_assistant |
| --- | --- | --- | --- | --- |
| View published projects (enrolled) | ✓ | ✓ | ✓ | ✓ |
| Create / edit institution projects | — | ✓ (own/courses) | ✓ | ✓ |
| Bulk publish / archive / delete | — | — | ✓ | ✓ |
| Bulk assign faculty | — | — | ✓ | — |
| Form / join team | ✓ | — | — | — |
| Approve / reject team | — | ✓ | ✓ | ✓ |
| Invite / transfer leadership | ✓ (leader) | — | — | — |
| Submit work | ✓ | — | — | — |
| Grade submissions | — | ✓ | ✓ | ✓ |
| Comments CRUD / resolve | ✓ (own thread) | ✓ | ✓ | ✓ |
| Peer review | ✓ | — | — | — |
| Faculty review | — | ✓ | ✓ | ✓ |

## Scoping rules

- **Institution admin** — all projects in tenant; bulk ops; dashboards; assign faculty
- **Faculty** — projects for assigned courses; approve teams; grade submissions; faculty reviews
- **Student** — published projects for enrolled courses only; own team, submissions, invitations, peer reviews

## Frontend gates

Pages use `PermissionGate` with `PERMISSIONS.PROJECT_READ`, `PROJECT_WRITE`, or `PROJECT_MANAGE` from `@learnova/constants`.

## API enforcement

Routes in `backend/src/routes/v1/project.routes.ts` apply:

- `PROJECT_READ` — list, get, dashboards, comments read
- `PROJECT_WRITE` — create, submit, team ops, grade, comment write
- `PROJECT_MANAGE` — bulk ops, institution dashboard, import, audit
