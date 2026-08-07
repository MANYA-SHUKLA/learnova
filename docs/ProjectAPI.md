# Project API

Base: `/api/v1/projects`

## Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects` | List (filters: course, faculty, status, type, difficulty, published, archived; sort) |
| GET | `/projects/me` | Current user's enrolled projects |
| GET | `/projects/search` | Full-text search |
| GET | `/projects/:id` | Get project |
| POST | `/projects` | Create |
| PATCH | `/projects/:id` | Update |
| DELETE | `/projects/:id` | Soft delete |
| POST | `/projects/:id/publish` | Publish |
| POST | `/projects/:id/archive` | Archive |
| POST | `/projects/:id/close` | Close |
| POST | `/projects/:id/duplicate` | Duplicate |
| POST | `/projects/:id/attachments` | Upload attachment |

## Bulk operations

| Method | Path | Body |
| --- | --- | --- |
| POST | `/projects/bulk/publish` | `{ ids: string[] }` |
| POST | `/projects/bulk/archive` | `{ ids: string[] }` |
| POST | `/projects/bulk/delete` | `{ ids: string[] }` |
| POST | `/projects/bulk/duplicate` | `{ ids: string[] }` |
| POST | `/projects/bulk/assign-faculty` | `{ ids: string[]; facultyId: string }` |

## Tags & categories

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/categories` | List project categories |
| GET | `/projects/tags` | List project tags |

## Milestones

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/milestones?projectId=` | List milestones |
| POST | `/projects/milestones` | Create |
| PATCH | `/projects/milestones/:id` | Update |
| DELETE | `/projects/milestones/:id` | Delete |
| POST | `/projects/milestones/:id/complete` | Mark complete |

## Teams

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/teams` | List teams |
| GET | `/projects/my-team` | Student's teams across projects |
| GET | `/projects/teams/:id` | Get team |
| POST | `/projects/teams` | Create team |
| POST | `/projects/teams/join` | Join team |
| PATCH | `/projects/teams/:id` | Update team |
| POST | `/projects/teams/:id/leave` | Leave team |
| DELETE | `/projects/teams/:id/members/:studentId` | Remove member |
| POST | `/projects/teams/:id/approve` | Faculty approve team |
| POST | `/projects/teams/:id/reject` | Faculty reject team |
| POST | `/projects/teams/:id/invite` | Invite student `{ studentId }` |
| POST | `/projects/teams/:id/transfer-leadership` | Transfer leader `{ studentId }` |
| POST | `/projects/teams/invitations/:id/accept` | Accept invitation |
| POST | `/projects/teams/invitations/:id/reject` | Reject invitation |

## Submissions

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/submissions` | List submissions |
| GET | `/projects/submissions/:id` | Get submission |
| POST | `/projects/submissions/draft` | Save draft |
| POST | `/projects/submissions/submit` | Submit work |
| POST | `/projects/submissions/:id/files` | Upload file |
| POST | `/projects/submissions/:id/grade` | Grade (score, feedback, suggestions, approval, revision) |

## Comments

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/:id/comments` | List comments (threaded) |
| POST | `/projects/:id/comments` | Create comment |
| PATCH | `/projects/comments/:id` | Update comment |
| DELETE | `/projects/comments/:id` | Delete comment |
| POST | `/projects/comments/:id/resolve` | Mark resolved |

## Reviews

| Method | Path | Description |
| --- | --- | --- |
| POST | `/projects/reviews` | Create review |
| GET | `/projects/reviews/:id` | Get review |
| POST | `/projects/reviews/:id/submit` | Submit review |

## Dashboards & admin

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects/dashboard/institution` | Institution stats |
| GET | `/projects/dashboard/faculty` | Faculty stats |
| GET | `/projects/dashboard/student` | Student stats |
| GET | `/projects/stats` | Institution analytics |
| GET | `/projects/export` | Export CSV/JSON |
| POST | `/projects/import` | Import CSV |
| GET | `/projects/audit` | Audit log |

## Permissions

All routes require authentication. See [ProjectPermissions.md](./ProjectPermissions.md).
