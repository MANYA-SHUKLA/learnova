# Assignment Submissions

Student work against a published assignment. Gated by enrollment on the assignment’s course.

## Model highlights

| Field | Notes |
| --- | --- |
| `attemptNumber` | Unique with assignmentId + studentId |
| `status` | draft · submitted · late · returned · graded · missing |
| `submissionType` | text · file · link · mixed |
| `files[]` | Stored via `IStorage` (base64 upload) |
| `textSubmission` | Rich/plain text body |
| `links[]` | External URLs |
| `lateSubmission` | Set when submitted after `dueDate` |
| `gradeId` | Linked `AssignmentGrade` after grading |

## Flow

1. Student opens published assignment (enrolled course)
2. Save **draft** (optional) → upload files if needed
3. **Submit** — checks `closeDate`, `allowLateSubmission`, `maxAttempts` / `allowResubmission`
4. Faculty **grades** → status `graded` or `returned`
5. Comments / feedback threaded on assignment (optionally tied to submission)

## Late policy

- After `dueDate`, if `allowLateSubmission` → accepted as `late` (penalty % stored on assignment for faculty reference)
- After `closeDate` → submissions rejected
- If late disallowed → submit fails validation

## See also

[Assignment.md](./Assignment.md) · [Rubrics.md](./Rubrics.md)
