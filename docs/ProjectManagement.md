# Enterprise Project Management

Full academic project lifecycle (Step **11**). Faculty and institution admins create projects; students work individually or in approved teams; milestones, submissions, comments, peer/faculty reviews, and prepared grades. **Not** AI ideation, exams, gradebook sync, or certificates.

Shared deadline, attempt, and grading primitives live in **[Assessment Core](./AssessmentCore.md)** (Step **9.5**).

```
Institution creates Project → Publish → Teams form & approve → Milestones → Submit work → Comments & Reviews → Grade prepared
```

## Capabilities

- Project CRUD with academic types (Mini Project, Capstone, Research, …)
- Slug, objective, problem statement, learning outcomes, difficulty, category, tags
- Team size limits, self-formation, faculty approval workflow
- Team invitations, accept/reject, transfer leadership, leave team
- Milestone planning with types (proposal, design, implementation, …)
- Publish · archive · close · open lifecycle
- Bulk publish, archive, delete, duplicate, assign faculty
- Student/team draft + submit (GitHub, demo video, live demo URL)
- Threaded comments with resolve
- Peer review + faculty review (score, feedback, suggestions, approval, revision required)
- Manual / marks / percentage / pass-fail / rubric grading (**prepared**, not pushed to gradebook)
- File uploads (PDF · DOCX · ZIP · images · video)
- Search & filters (course · faculty · status · type · difficulty · published · archived)
- Import / export · duplicate
- Role dashboards: institution · faculty · student
- Audit trail + domain events
- Seed: 50 projects · 100 teams · 500 milestones · 300 submissions · reviews · comments

## Project types

| Type | Description |
| --- | --- |
| `mini_project` | Short scoped project |
| `major_project` | Semester-long major deliverable |
| `capstone` | Final-year capstone |
| `research` | Research-oriented work |
| `case_study` | Case analysis project |
| `industry_project` | Industry-sponsored project |
| `innovation_challenge` | Innovation / hackathon style |
| `open_project` | Open-ended exploration |

Legacy participation modes (`individual`, `team`, `hybrid`) remain supported for backward compatibility.

## Status (activity lifecycle)

| Status | Meaning |
| --- | --- |
| `draft` | Editable, not visible to students |
| `published` | Visible to enrolled students |
| `open` | Accepting submissions |
| `closed` | No new submissions |
| `archived` | Soft-retired |

## UI routes

| Role | Path |
| --- | --- |
| Institution | `/institution/projects`, `/institution/projects/create`, `/institution/projects/:id`, `/institution/projects/:id/milestones` |
| Faculty | `/faculty/projects`, `/faculty/projects/:id` |
| Student | `/student/projects`, `/student/projects/:id`, `/student/my-team` |

## Architecture

- **Assessment Core consumer** — deadlines, attempts, grading via `@learnova/shared` helpers
- **Separate from AI Ideation** — `features/ideation` and `ENABLE_AI` are future
- **Gradebook boundary** — grades stay `preparedForGradebook: false` until Step 13

## Related docs

- [ProjectAPI.md](./ProjectAPI.md)
- [ProjectPermissions.md](./ProjectPermissions.md)
- [ProjectTeams.md](./ProjectTeams.md)
- [ProjectMilestones.md](./ProjectMilestones.md)
- [ProjectReviews.md](./ProjectReviews.md)
- [AssessmentCore.md](./AssessmentCore.md)

## Out of scope

AI ideation · Quizzes · Exams · Gradebook sync · Certificates · Attendance · Judge0 / coding engine

## Seed

```bash
pnpm --filter @learnova/backend seed:projects
```
