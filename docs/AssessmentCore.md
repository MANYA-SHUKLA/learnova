# Assessment Core

Shared assessment primitives for **Assignments**, **Practice Labs**, **Quizzes**, **Exams**, and (later) **Projects**.

Introduced as Step **9.5** so grading, deadlines, attempts, feedback, audit naming, and permission patterns are defined once — not reimplemented per module.

```
Assessment Core
  ↓
Assignments (9) ✅
  ↓
Labs (10)
  ↓
Quizzes (optional)
  ↓
Exams (12)
  ↓
Gradebook (13)
```

## Packages

| Package | Path | Responsibility |
| --- | --- | --- |
| `@learnova/types` | `packages/types/src/assessment` | Interfaces & unions |
| `@learnova/constants` | `packages/constants/src/assessment` | Enums, file limits, enrollment gate, permission helper |
| `@learnova/validation` | `packages/validation/src/assessment.ts` | Zod schemas (deadlines, attempts, marks, grade, feedback, upload) |
| `@learnova/shared` | `packages/shared/src/assessment` | Pure helpers (lifecycle, window, attempts, grade outcome) |

Import helpers from `@learnova/shared` (or `@learnova/shared/assessment`).

## What is shared

### Lifecycle

`draft` → `published` → `closed` / `archived` (with defined transitions)

### Attempt / submission status

`draft` · `submitted` · `late` · `returned` · `graded` · `missing`

### Grading methods

`manual` · `rubric` · `pass_fail` · `marks` · `percentage` · `auto` (labs/exams)

### Deadline policy

`publishDate` · `dueDate` · `closeDate` · `allowLateSubmission` · `latePenaltyPercent`

Helpers: `evaluateSubmissionWindow`, `isPastDue`, `isPastClose`, `applyLatePenalty`

### Attempt policy

`allowResubmission` · `maxAttempts`  
Helper: `evaluateAttempt`

### Grade normalization

`resolveGradeOutcome` → `{ marksObtained, percentage, passed }` across all methods (incl. late penalty)

### Feedback

Shared feedback input schema + `AssessmentFeedbackItem` shape for threaded comments

### Files

Shared allow-list + `ASSESSMENT_MAX_FILE_BYTES` + `extensionForContentType`

### Permissions contract

Each module registers `{kind}:read|write|manage` (e.g. `assignment:*`, later `lab:*`, `exam:*`).  
Helper: `assessmentPermission(kind, action)`

Enrollment gate statuses: `ASSESSMENT_ENROLLMENT_STATUSES` = `active` | `approved` | `completed`

### Audit / events

Canonical actions: `created` · `updated` · `deleted` · `published` · `archived` · `closed` · `submitted` · `graded` · `feedback_added` · `attachment_uploaded` · `attempt_started` · `attempt_expired`

Domain event names stay dotted (`assignment.published`, `submission.graded`, `feedback.added`). Use `assessmentAuditEventName(kind, action)` when generating names from core actions.

## What stays module-specific

| Module | Owns |
| --- | --- |
| Assignments | Types (homework/essay/…), ERP attachment UX, assignment routes/UI |
| Labs | Judge0 / IDE session, code delivery, auto-grade runners |
| Quizzes | Question banks, timed questions, shuffle |
| Exams | Proctoring, seating, timed windows, integrity |
| Gradebook | Aggregation across activities |

## Assignments integration

Assignment helpers (`assignment.helpers.ts`) are **thin adapters** over Assessment Core. Assignment Zod schemas re-use core lifecycle / attempt / upload schemas.

New labs/quizzes/exams **must** import core helpers — do not copy deadline or grading logic.

## Tests

`apps/backend/src/__tests__/assessment/core.test.ts`

## Related

- [ADR 0006 — Assessment Core](./adr/0006-assessment-core.md)
- [Assignment.md](./Assignment.md)
- [Roadmap.md](./Roadmap.md) Step 9.5
