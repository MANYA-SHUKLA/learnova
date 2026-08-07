# Collaboration Engine

Independent collaboration infrastructure for **Project Management** (Step **11**).

Project Management is **not** a grading or certificate system. It is a collaboration layer that produces structured academic project data for downstream modules.

```
Collaboration Engine
  ↓
Project Management (11) ✅
  ↓
Learning Progress bridge (future) — milestone events
  ↓
Gradebook (13) — consumes evaluation-ready submissions
  ↓
Certificates (14) — consumes gradebook outcomes
```

Canonical implementation: `apps/backend/src/services/collaboration-engine/`

## Responsibilities (Step 11)

| Area | Owned here | Not owned here |
| --- | --- | --- |
| Teams | create, invite, approve, transfer leadership | — |
| Milestones | CRUD, completion, default templates | Progress rollup (future bridge) |
| Submissions | draft, submit, attachments, GitHub/demo URLs | Marks / GPA |
| Reviews | faculty supervision, peer review, approval, revision | Final grades |
| Comments | threaded discussion, resolve | — |
| Evaluation | mark **evaluation ready** for export | Gradebook scoring |

## Integrations

### Courses (required)

Every project belongs to a `courseId` (optional `moduleId` / `lessonId`).

- Enrollment gate: only enrolled students participate (`CollaborationEnrollmentGate`)
- Faculty scope: supervisors see projects for courses they teach

Implementation: `collaboration-engine/integrations.ts`

### Students (required)

Students work **individually** or in **teams** via `ProjectMember`.

- Join / invite / accept / reject flows
- Submissions attributed via `submittedBy` + `studentId` / `teamId`

### Faculty (required)

Faculty **supervise** and **review** — they do not assign final marks in Step 11.

- Approve/reject teams
- Submit faculty reviews (score, feedback, suggestions, approval, revision required)
- Mark submissions **evaluation ready** when work is complete

### Assignments (optional future)

Projects may store `linkedAssignmentId` for cross-linking with Step 9 assignments.

- No assignment submission or grading logic is duplicated here

### Learning Progress (future)

`CollaborationProgressBridge.onMilestoneCompleted` is reserved for Step 8.5 integration.

- Milestone completion events exist (`project.milestone.completed`)
- Progress rollup is implemented in a later step, not in Project Management

### Gradebook (future only)

Gradebook (Step **13**) consumes records where `evaluationStatus === 'ready'`.

- Step 11 sets `evaluationStatus`, `evaluationReadyAt`, `evaluationReadyBy`
- Step 11 does **not** create `ProjectGrade` rows or compute marks
- `ProjectGrade` model is reserved for Gradebook consumer use

API: `POST /api/v1/projects/submissions/:id/mark-evaluation-ready`

## Evaluation lifecycle

| Status | Meaning |
| --- | --- |
| `pending` | Submitted, awaiting faculty review |
| `ready` | Faculty marked evaluation ready — exportable to Gradebook |
| `exported` | Gradebook consumed the record (Step 13) |

## Domain events

| Event | When |
| --- | --- |
| `project.created` | Project created |
| `project.team.approved` | Faculty approves team |
| `project.milestone.completed` | Milestone completed |
| `project.submission.created` | Student/team submits |
| `project.review.submitted` | Review finalized |
| `project.evaluation.ready` | Ready for Gradebook export |

## Hard rules

1. **No grading in Step 11** — use reviews + evaluation ready
2. **No certificates in Step 11**
3. **Do not duplicate** enrollment, course, or assignment logic — integrate via adapters
4. **Gradebook reads, does not re-implement** team/milestone/submission flows

## Related docs

- [ProjectManagement.md](./ProjectManagement.md)
- [ProjectAPI.md](./ProjectAPI.md)
- [AssessmentCore.md](./AssessmentCore.md)
