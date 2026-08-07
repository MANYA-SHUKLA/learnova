# Assessment Core

Shared assessment primitives for **Assignments**, **Practice Labs**, **Projects**, **Quizzes**, **Exams**, and **Gradebook** integration.

Introduced as Step **9.5** so grading, deadlines, attempts, feedback, audit naming, and permission patterns are defined once — not reimplemented per module.

```
Assessment Core
  ↓
Assignments (9) ✅
  ↓
Labs (10) ✅  ── uses Coding Assessment Engine
  ↓
Projects (11) ✅  ── uses Collaboration Engine (no grading in Step 11)
  ↓
Quizzes (12) ✅  ── uses Assessment Core question engine (rendering, attempts, auto-scoring)
  ↓
Exams (13) ✅  ── reuses Assessment Core question engine + examinationEngine (policies only) + Coding Engine (no second runner)
  ↓
Gradebook (14)
```

## Packages

| Package | Path | Responsibility |
| --- | --- | --- |
| `@learnova/types` | `packages/types/src/assessment` | Interfaces & unions |
| `@learnova/constants` | `packages/constants/src/assessment` | Enums, file limits, enrollment gate, permission helper |
| `@learnova/validation` | `packages/validation/src/assessment.ts` | Zod schemas (deadlines, attempts, marks, grade, feedback, upload) |
| `@learnova/shared` | `packages/shared/src/assessment` | Pure helpers (lifecycle, window, attempts, grade outcome) + **question engine** (rendering, auto-evaluation, scoring, analytics) |

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

## Question-based assessment engine

Shared by **Quiz Management (12)** and **Exam Management (13)**. Lives in `@learnova/shared` as `assessmentQuestionEngine` — I/O-free, no Mongo/Express.

```
Assessment Core (question engine)
  ├── Question rendering      renderQuestionForAttempt · renderQuestionForReview
  ├── Question selection      selectQuestionsForActivity (sections + shuffle)
  ├── Attempt lifecycle       canStartQuestionAttempt · isTimedAttemptExpired · resolveTimedAttemptStatus
  ├── Auto-evaluation         evaluateQuestionAnswer (MCQ · T/F · match · fill-blank)
  ├── Scoring                 scoreQuestionAttempt → score · percentage · pass/fail
  └── Analytics helpers       computeQuestionAccuracy · computePassRate · rankMostIncorrectQuestions
```

Backend adapter: `apps/backend/src/services/quiz-engine/` re-exports `@learnova/shared` — **do not add logic there**.

Types: `EvaluableQuestion`, `QuestionAnswerInput`, `RenderedAssessmentQuestion`, `QuestionStatRow` in `@learnova/types` (`packages/types/src/assessment`).

Tests: `apps/backend/src/__tests__/assessment/question-evaluation.test.ts`

## Examination policy engine

Exam Management (Step **13**) adds **`examinationEngine`** in `@learnova/shared` (`packages/shared/src/assessment/examination-policies.ts`). It **wraps** `assessmentQuestionEngine` — no duplicate evaluation logic.

```
examinationEngine
  ├── Re-exports question engine   render · select · evaluate · score · analytics
  └── Exam-only policies           schedule windows · check-in · secure browser · proctor violations · seating
```

Backend adapter: `apps/backend/src/services/examination-engine/` re-exports `@learnova/shared` — **do not add logic there**.

Question storage remains in the Quiz module (`Question`, `QuestionBank`). Exams reference question IDs.

## What stays module-specific

| Module | Owns |
| --- | --- |
| Assignments | Types (homework/essay/…), ERP attachment UX, assignment routes/UI |
| Labs | Problem bank, practice UX — **execution via Coding Engine** |
| Coding Engine | Judge0, languages, evaluate/score, execution history (shared) |
| Projects | Team/milestone/submission/review collaboration — **via Collaboration Engine**; evaluation ready only (no marks in Step 11) |
| Quizzes | Question banks, quiz builder, routes/UI — **via Assessment Core question engine** |
| Exams | Scheduling, proctoring, seating, integrity — **reuse Assessment Core question engine** for MCQ/quiz questions and **Coding Engine** for code questions |
| Gradebook | Aggregation across activities |

## Assignments integration

Assignment helpers (`assignment.helpers.ts`) are **thin adapters** over Assessment Core. Assignment Zod schemas re-use core lifecycle / attempt / upload schemas.

New labs/quizzes/exams **must** import Assessment Core helpers — do not copy deadline or grading policy logic.

Quiz Management **must** import **`assessmentQuestionEngine`** from `@learnova/shared` (backend adapter: `services/quiz-engine`) for rendering, attempt rules, and auto-scoring — do not duplicate evaluation logic.

Exams (Step 13) **must** reuse **`assessmentQuestionEngine`** for all quiz-style questions (MCQ, T/F, match, fill-blank) — only add scheduling, proctoring, secure browser, exam rules, and invigilation policies on top.

Coding Exams **must** import the [Coding Assessment Engine](./CodingEngine.md) for run/evaluate/score — do not copy Judge0 or test-case scoring.

Project Management **must** import the [Collaboration Engine](./CollaborationEngine.md) — do not assign marks or certificates in Step 11; Gradebook consumes evaluation-ready submissions.

## Tests

`apps/backend/src/__tests__/assessment/core.test.ts`

## Related

- [ADR 0006 — Assessment Core](./adr/0006-assessment-core.md)
- [CodingEngine.md](./CodingEngine.md)
- [Assignment.md](./Assignment.md)
- [QuizManagement.md](./QuizManagement.md)
- [ExamManagement.md](./ExamManagement.md)
- [Roadmap.md](./Roadmap.md) Step 9.5
