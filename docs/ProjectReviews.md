# Project Reviews

Peer and faculty reviews on project submissions (Step **11**).

## Model

| Field | Description |
| --- | --- |
| `projectId` | Parent project |
| `submissionId` | Submission being reviewed |
| `reviewerId` | Student or faculty user |
| `reviewType` | `peer` · `faculty` |
| `score` / `rating` | Numeric score |
| `feedback` | Written feedback |
| `suggestions` | Improvement suggestions |
| `approval` | Whether work is approved |
| `revisionRequired` | Whether resubmission is required |
| `status` | `draft` · `submitted` |

## Flow

1. Faculty enables `allowPeerReview` with `peerReviewsRequired` count
2. Enrolled students review assigned peer submissions
3. Faculty adds faculty reviews during grading (score, feedback, suggestions, approval, revision flag)
4. Reviews inform grade preparation (not gradebook until Step 13)

## Grading integration

Faculty grading on submissions supports:

- `marksObtained` / `score`
- `feedback` + `suggestions`
- `approval` (pass) vs `revisionRequired` (return for rework)
- `returnToStudent` to notify learner

## API

- `POST /api/v1/projects/reviews` — create review
- `GET /api/v1/projects/reviews/:id` — get review
- `POST /api/v1/projects/reviews/:id/submit` — submit review
- `POST /api/v1/projects/submissions/:id/grade` — grade with review fields

## UI

- Student peer review: `/student/projects/:id` (Reviews tab)
- Faculty review & grade: `/faculty/projects/:id` (Submissions tab)

## Events

- `project.review.submitted`
- `project.submission.graded`
