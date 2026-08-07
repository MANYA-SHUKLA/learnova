# Examination Policies

Reusable exam policy templates stored in `exam_policies`. Runtime policies on each exam remain embedded in `Exam.proctoring` and `Exam.rules`; templates are created via `POST /api/v1/examinations/policies`.

## Policy domains

| Domain | Fields |
| --- | --- |
| Attempts | `attemptLimit`, negative marking |
| Navigation | `shuffleQuestions`, `shuffleOptions`, `allowBacktracking` |
| Tools | `calculatorAllowed` |
| Secure browser | `secureBrowser`, `requireFullscreen`, copy/paste/tab blocks |
| Proctoring | `proctoringMode`, webcam/mic requirements, `maxTabSwitches`, `autoTerminateOnViolation` |

## Engine

Policy evaluation for windows, check-in, secure browser, and violations uses `examinationEngine` in `@learnova/shared` — **not** duplicated in the exam service.

## API

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/examinations/policies` | `examination:read` |
| POST | `/examinations/policies` | `examination:write` |

See [ExamManagement.md](./ExamManagement.md) and [AssessmentCore.md](./AssessmentCore.md).
