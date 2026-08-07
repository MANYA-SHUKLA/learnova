# Project Teams

Team collaboration for academic projects (Step **11**).

## Model

| Field | Description |
| --- | --- |
| `projectId` | Parent project |
| `teamName` / `name` | Team display name |
| `leaderId` | Student team leader |
| `status` | `pending` · `approved` · `rejected` · `completed` |
| `memberCount` | Active members |

## ProjectMember (separate model)

| Field | Description |
| --- | --- |
| `teamId` | Parent team |
| `studentId` | Member student |
| `role` | `leader` · `member` |
| `approvedBy` | Faculty who approved membership |
| `invitationStatus` | `pending` · `accepted` · `rejected` · `expired` |

## Flow

1. Faculty publishes a team-capable project with `minimumTeamSize` / `maximumTeamSize`
2. Students create a team or receive an invitation
3. Team status starts `pending` until faculty approves (`approved`) or rejects (`rejected`)
4. Leader can invite members, transfer leadership, or leave (with auto-promote fallback)
5. Approved team submits milestone/final work under `teamId`
6. Progress rolls up to each member via `ProjectProgress`

## API

- `POST /api/v1/projects/teams` — create team
- `POST /api/v1/projects/teams/join` — join team (enrollment-gated)
- `POST /api/v1/projects/teams/:id/leave` — leave team
- `POST /api/v1/projects/teams/:id/approve` — faculty approve
- `POST /api/v1/projects/teams/:id/reject` — faculty reject
- `POST /api/v1/projects/teams/:id/invite` — leader invite `{ studentId }`
- `POST /api/v1/projects/teams/:id/transfer-leadership` — transfer leader
- `POST /api/v1/projects/teams/invitations/:id/accept|reject` — invitation response
- `GET /api/v1/projects/my-team` — student's teams across projects
- `DELETE /api/v1/projects/teams/:id/members/:studentId` — remove member

## UI

- Student team management: `/student/projects/:id` (Team tab)
- All teams list: `/student/my-team`
- Faculty approval: `/faculty/projects` and `/faculty/projects/:id`

## Events

- `project.team.created`
- `project.team.approved`
- `project.team.rejected`
- `project.team.invited`
- `project.team.joined`
