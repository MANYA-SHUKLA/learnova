# Enterprise Quiz Management

Full formative and summative quiz lifecycle (Step **12**). Faculty and institution admins author quizzes from reusable question banks; students attempt timed or untimed assessments with auto-evaluation; faculty view analytics and results. **Not** proctored exams, gradebook sync, or certificates.

Shared deadline, attempt, and grading primitives live in **[Assessment Core](./AssessmentCore.md)** (Step **9.5**). Question rendering, auto-evaluation, scoring, and analytics run through **`assessmentQuestionEngine`** in `@learnova/shared` — the same engine Exam Management (Step **13**) will reuse.

```
Question Bank → Quiz Builder → Publish → Student Attempt → Auto Evaluation → Results → Analytics
```

## Architecture

Quiz Management is an **independent assessment module** that **composes Assessment Core** — it owns quiz-specific I/O (Mongo models, API, UI, seeds) but **not** generic assessment logic.

```
Assessment Core (packages/shared/src/assessment)
  ├── Lifecycle & deadlines (shared with Assignments)
  └── assessmentQuestionEngine
        ├── Question rendering & selection
        ├── Attempt lifecycle (timed)
        ├── Auto-evaluation & scoring
        └── Analytics helpers

Quiz Management (Step 12)          Exam Management (Step 13 — future)
  models · routes · UI · seeds       + scheduling · proctoring · secure browser · exam rules
```

| Layer | Owner | Responsibility |
| --- | --- | --- |
| **Assessment Core** | `@learnova/shared` | Question rendering, randomization, attempt rules, auto-scoring, result calculation, analytics helpers |
| **Quiz Management** | `services/quiz/` | Quiz CRUD, question bank storage, enrollment gates, dashboards, audit, seeds |
| **Exam Management** (13) | future | Reuses Assessment Core; adds schedules, availability, proctoring, invigilation only |

It integrates with:

| Module | Integration |
| --- | --- |
| **Courses** | Every quiz belongs to a course; optional module/lesson link |
| **Enrollments** | Students attempt only when enrolled (`active` · `approved` · `completed`) |
| **Faculty** | Author quizzes, manage question banks, view analytics |
| **Assessment Core** | Lifecycle, visibility, attempt policy, grade outcome helpers |
| **Gradebook** (Step **14**) | Will consume quiz scores (not wired in Step 12) |

**Step 12 does not implement gradebook sync or certificates.** Quizzes produce scored results; Gradebook aggregates later.

```
Quiz Engine → Quiz Management → scored results → Gradebook (future)
```

## Capabilities

- Quiz CRUD with academic types (practice, lesson, module, course, revision)
- Slug, instructions, difficulty, passing marks, duration, attempt limits
- Sections with per-section randomization and question pools
- Question bank CRUD, categories, tags, duplicate, archive
- Six question types: single/multiple choice, true/false, assertion-reason, match-following, fill-blank
- Publish · archive · close lifecycle
- Bulk publish, archive, delete, duplicate, assign faculty
- Student start attempt, save answers incrementally, submit (auto or manual)
- Auto-evaluation with optional negative marking
- Immediate results / review mode / show correct answers (configurable)
- Shuffle questions and options
- Search & filters (course · module · lesson · status · type · difficulty · published)
- Import / export (JSON · CSV)
- Role dashboards: institution · faculty · student
- Per-quiz analytics and institution-wide stats
- Audit trail + domain events
- Seed: 100 quizzes · 5k questions · 10k attempts · results · audit

## Quiz types

| Type | Description |
| --- | --- |
| `practice` | Low-stakes practice / self-check |
| `lesson` | Tied to a lesson checkpoint |
| `module` | Module-level assessment |
| `course` | Course-wide summative quiz |
| `revision` | Revision / exam-prep drill |

## Status (activity lifecycle)

| Status | Meaning |
| --- | --- |
| `draft` | Editable, not visible to students |
| `published` | Visible to enrolled students |
| `closed` | No new attempts |
| `archived` | Soft-retired |

## Models

| Model | Purpose |
| --- | --- |
| `Quiz` | Title, slug, course/module/lesson, settings, section/question refs |
| `QuizSection` | Section title, marks, randomization, question pool |
| `QuestionBank` | Reusable pool with categories, tags, question count |
| `Question` | Stem, type, options, match pairs, fill-blank answers, marks |
| `QuestionCategory` | Institution taxonomy for banks |
| `QuestionTag` | Free-form tags for banks |
| `QuizAttempt` | Student attempt, timer, status, score |
| `QuizAnswer` | Per-question response, correctness, marks awarded |
| `QuizResult` | Aggregated outcome: correct/incorrect/skipped, passed, rank |
| `QuizAuditLog` | Domain audit events |

## UI routes

| Role | Path |
| --- | --- |
| Institution | `/institution/quizzes`, `/institution/question-bank` |
| Faculty | `/faculty/quizzes`, `/faculty/question-bank` |
| Student | `/student/quizzes`, `/student/quizzes/:id`, `/student/results` |

## Related docs

- [QuizBuilder.md](./QuizBuilder.md)
- [QuestionBank.md](./QuestionBank.md)
- [QuizAPI.md](./QuizAPI.md)
- [QuizPermissions.md](./QuizPermissions.md)
- [QuizAnalytics.md](./QuizAnalytics.md)
- [AssessmentCore.md](./AssessmentCore.md)

## Out of scope

Proctored exams · Seating · Integrity monitoring · Gradebook sync · Certificates · Coding questions (Judge0) · Attendance · AI question generation

## Seed

```bash
pnpm --filter @learnova/backend seed:quizzes
```
