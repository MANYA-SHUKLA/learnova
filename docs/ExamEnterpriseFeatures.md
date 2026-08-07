# Enterprise Examination Features

Production-ready university capabilities added to Step **13** — all within the Examination module (not Gradebook or Analytics).

## Question Paper Blueprints

Define distribution by **difficulty**, **topic/category**, and **marks** before generating an exam paper.

| API | Description |
| --- | --- |
| `POST /examinations/blueprints` | Create blueprint with slots + question pool |
| `GET /examinations/blueprints` | List blueprints |
| `POST /examinations/blueprints/apply` | Apply blueprint → sets exam `questionIds` |

Engine: `selectQuestionsByBlueprint` in `@learnova/shared` (reuses Question Bank pool — no duplicate questions).

## Exam Templates

Reusable configurations: duration, policies, proctoring, marking scheme, reconnection grace.

| API | Description |
| --- | --- |
| `POST /examinations/templates` | Save template |
| `GET /examinations/templates` | List templates |
| `POST /examinations/templates/create-exam` | Instantiate draft exam from template |

Distinct from **ExamPolicy** (rules-only presets). Templates include full exam structure defaults.

## Role-based Invigilation

Multiple faculty per live exam with scoped permissions:

| Role | Capabilities |
| --- | --- |
| `view_only` | Live monitoring, incident timeline |
| `monitor` | + flag/clear attempts |
| `intervene` | + terminate attempts |

| API | Description |
| --- | --- |
| `POST /examinations/invigilators/assign` | Assign roles |
| `GET /examinations/:id/invigilators` | List assignments |

## Incident Timeline

Unified chronological audit log (`exam_incidents`) for disputes:

- publish · version created · check-in · start · disconnect · reconnect · submit · violations · accessibility

| API | Description |
| --- | --- |
| `GET /examinations/:id/incidents?attemptId=` | Timeline (exam or per-attempt) |

## Graceful Reconnection

- Attempt stores `sessionToken`, `selectedQuestionIds`, `disconnectedAt`
- Configurable `reconnectionGraceMinutes` on exam (default 5)
- `POST /examinations/attempts/heartbeat` — mark connected/disconnected
- `POST /examinations/attempts/resume` — restore session + saved answers within grace window

## Accessibility Settings

Per-student accommodations on an exam:

- Extended time (`extendedTimePercent`, `extraMinutes`)
- Font size (`default` · `large` · `xlarge`)
- Screen reader allowance

| API | Description |
| --- | --- |
| `POST /examinations/accessibility` | Upsert accommodation |
| `GET /examinations/:id/accessibility` | List accommodations |

Applied automatically at attempt start (extended duration + font size on attempt).

## Exam Versioning

On **publish**, an immutable `ExamVersion` snapshot is created (questions, sections, rules, schedule, proctoring).

- Attempts store `examVersionId` and frozen `selectedQuestionIds`
- Edits to the live exam do not alter in-progress or historical attempts
- `GET /examinations/:id/versions` — version history

## Assessment Core reuse

Blueprints select from the **Question Bank**; evaluation/scoring still uses `assessmentQuestionEngine` — no new assessment engine.

## Related

- [ExamManagement.md](./ExamManagement.md) · [ExamAPI.md](./ExamAPI.md) · [LiveMonitoring.md](./LiveMonitoring.md)
