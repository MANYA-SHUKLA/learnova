# Quiz Builder

Authoring workflow for quizzes — sections, question assignment, randomization, and draft autosave. Used by faculty and institution admins when creating or editing a quiz.

## Sections

A quiz is composed of **sections** (up to 20) plus optional flat `questionIds` when no sections are used.

| Field | Description |
| --- | --- |
| `title` | Section heading (required) |
| `description` | Optional instructions for this section |
| `marks` | Section mark budget (informational; actual marks come from questions) |
| `questionCount` | Expected question count |
| `displayOrder` | Sort order in the quiz |
| `questionIds` | Pool of question ObjectIds from the question bank |
| `randomizeQuestions` | Shuffle the pool before selection |
| `randomQuestionCount` | Draw N questions from the pool (subset sampling) |

Sections are persisted as `QuizSection` documents linked from the parent `Quiz.sectionIds`.

### Flat vs sectioned layout

- **Sectioned** — each section defines its own pool and optional random draw; the Quiz Engine concatenates selections in `displayOrder`.
- **Flat** — quiz-level `questionIds` with global `shuffleQuestions` on the quiz document.

## Randomization

Randomization operates at three levels:

| Level | Setting | Effect |
| --- | --- | --- |
| Quiz | `shuffleQuestions` | Shuffles the final question order (flat layout) |
| Quiz | `shuffleOptions` | Shuffles MCQ option order per question at render time |
| Section | `randomizeQuestions` + `randomQuestionCount` | Picks a random subset from the section pool |

The Quiz Engine function `selectQuestionsForQuiz` applies section specs first, then deduplicates. Option shuffling happens in `renderQuestionForAttempt` so correct answers are never leaked before submission.

## Drag-and-drop concept

The builder UI uses a **drag-and-drop mental model** for authoring (implemented via client state, not a separate backend endpoint):

1. **Sections** — reorder by dragging section cards; `displayOrder` updates on save.
2. **Questions within a section** — drag from the question bank sidebar into a section drop zone; `questionIds` array order reflects display intent.
3. **Cross-section moves** — drag a question chip from one section to another; the store removes it from the source and appends to the target.

Backend persistence is a single `PATCH /quizzes/:id` with the full `sections` array — no granular reorder API.

## Autosave

Client-side draft state lives in `useQuizBuilderStore` (Zustand):

| State field | Purpose |
| --- | --- |
| `quizId` | Linked quiz (null for new) |
| `title` | Working title |
| `sections` | Section stubs with `questionIds` |
| `questionIds` | Flat question list (non-sectioned) |
| `dirty` | Unsaved changes flag |
| `lastSavedAt` | ISO timestamp of last successful save |

**Autosave flow:**

1. User edits → `setDraft()` marks `dirty: true`.
2. Debounced `PATCH /quizzes/:id` (or `POST /quizzes` for create) persists to the server.
3. On success → `markSaved()` clears `dirty` and sets `lastSavedAt`.

Draft quizzes remain in `draft` status until explicitly published. Autosave does **not** publish — it only persists editor state.

## Quiz settings (builder panel)

| Setting | Default | Notes |
| --- | --- | --- |
| `durationMinutes` | null (untimed) | Timer enforced by Quiz Engine on attempt |
| `attemptLimit` | 3 | Max attempts per student |
| `passingMarks` | 40 | Pass threshold (absolute marks) |
| `totalMarks` | 100 | Display total; sum of question marks may differ |
| `showResultsImmediately` | true | Show score after submit |
| `showCorrectAnswers` | false | Reveal correct options in review |
| `allowReview` | true | Student can review submitted attempt |
| `negativeMarking` | false | Deduct marks on wrong answers |
| `negativeMarkValue` | 0.25 | Default per-question penalty when enabled |
| `publishDate` / `closeDate` | null | Assessment Core window |

## Related docs

- [QuizManagement.md](./QuizManagement.md)
- [QuestionBank.md](./QuestionBank.md)
- [QuizAPI.md](./QuizAPI.md)
