# Enterprise Examination Management

Step **13** — scheduled, proctored examinations built on **[Assessment Core](./AssessmentCore.md)**. **No new assessment engine** — all question rendering, attempts, auto-evaluation, scoring, and analytics reuse `assessmentQuestionEngine` via `examinationEngine`.

```
Assessment Core (assessmentQuestionEngine)
  + examinationEngine (exam policies only)
        ↓
Exam Management (scheduling · seating · proctoring · secure browser)
```

## What Examination owns (Step 13 only)

| Capability | Owner |
| --- | --- |
| Question rendering & selection | `@learnova/shared` → `assessmentQuestionEngine` |
| Auto-evaluation & scoring | `@learnova/shared` → `assessmentQuestionEngine` |
| Analytics helpers | `@learnova/shared` |
| Question bank storage | Quiz module (`Question`, `QuestionBank`) — **reused, not duplicated** |
| Exam schedule & windows | Exam module |
| Seating & check-in | Exam module |
| Secure browser policy | Exam module |
| Proctoring sessions & events | Exam module |
| Invigilation (flag / clear / terminate) | Exam module |

## Exam types

`midterm` · `final` · `internal` · `external` · `practical` · `viva`

## Status lifecycle

`draft` → `scheduled` → `published` → `in_progress` → `completed` / `archived` / `cancelled`

## Architecture rule

**DO NOT** duplicate:

- Question evaluation (`evaluateQuestionAnswer`)
- Attempt scoring (`scoreQuestionAttempt`)
- Question rendering (`renderQuestionForAttempt`)
- Randomization (`selectQuestionsForActivity`)

Import from `@learnova/shared`:

```typescript
import { examinationEngine } from '@learnova/shared';
// or backend adapter:
import { examinationEngine } from '../examination-engine/index.js';
```

## UI routes

| Role | Route |
| --- | --- |
| Institution | `/institution/examinations` |
| Faculty | `/faculty/examinations` · `/faculty/proctoring` |
| Student | `/student/examinations` · `/student/examinations/:id` |

## Seed

```bash
pnpm --filter @learnova/backend seed:quizzes      # questions required
pnpm --filter @learnova/backend seed:examinations  # 20 exams · 500 attempts
```

## Out of scope (Step 13)

Gradebook sync · Certificates · AI question generation · Notifications

## Related

- [ExamProctoring.md](./ExamProctoring.md) · [ExamAPI.md](./ExamAPI.md) · [ExamPermissions.md](./ExamPermissions.md)
- [QuizManagement.md](./QuizManagement.md) · [AssessmentCore.md](./AssessmentCore.md)
