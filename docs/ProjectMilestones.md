# Project Milestones

Milestone tracking for long-running academic projects (Step **11**).

## Model

| Field | Description |
| --- | --- |
| `projectId` | Parent project |
| `title` | Milestone name |
| `description` | Instructions / deliverables |
| `milestoneType` | `proposal` · `design` · `implementation` · `testing` · `documentation` · `presentation` · `final_submission` · `custom` |
| `dueDate` | Target completion |
| `weight` / `weightage` | Percentage weight toward final grade |
| `order` | Display order |
| `status` | `pending` · `in_progress` · `completed` · `overdue` |

## Default milestone types

Proposal → Design → Implementation → Testing → Documentation → Presentation → Final Submission

Projects may auto-seed this set on create or faculty adds custom milestones.

## Flow

1. Faculty defines milestones when `allowMilestones` is enabled
2. Students/teams submit work per milestone (`submission.milestoneId`)
3. Faculty marks milestones complete or system marks overdue after due date
4. Final submission may be separate or last milestone

## API

- `GET/POST /api/v1/projects/milestones`
- `PATCH/DELETE /api/v1/projects/milestones/:id`
- `POST /api/v1/projects/milestones/:id/complete`

## UI

- Institution: `/institution/projects/:id` (Milestones tab) and `/institution/projects/:id/milestones`
- Faculty: `/faculty/projects/:id` (Milestones tab)
- Student: `/student/projects/:id` (Milestones tab)

## Events

- `project.milestone.created`
- `project.milestone.completed`
