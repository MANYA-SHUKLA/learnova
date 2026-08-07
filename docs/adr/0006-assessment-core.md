# ADR 0006: Shared Assessment Core

- **Status:** Accepted
- **Date:** 2026-08-08
- **Deciders:** Platform team

## Context

Learnova’s Academic Assessment Platform spans Assignments (shipped), then Practice Labs, Quizzes, Exams, Gradebook, and Certificates. Each surface needs:

- Lifecycle (draft / published / closed / archived)
- Deadlines and late policy
- Attempt limits and resubmission
- Grading methods and normalized score outcomes
- Feedback / comments
- File upload constraints
- Audit actions and domain events
- Permission triad (`read` / `write` / `manage`)

If each module reimplements these rules, grading and submission logic will diverge and become expensive to fix.

## Decision

Introduce an **Assessment Core** (Step **9.5**) **before Practice Labs**:

1. Shared **types**, **constants**, **Zod schemas**, and **pure helpers** in `@learnova/types`, `@learnova/constants`, `@learnova/validation`, `@learnova/shared`
2. Module packages (assignment, lab, quiz, exam) **compose** core primitives; they own only domain-specific fields and I/O
3. Assignments already adapted to call core helpers (thin wrappers for backward-compatible messages)
4. Module permissions remain `{kind}:*` but follow the same contract via `assessmentPermission`

## Consequences

- Labs / Quizzes / Exams start faster with consistent deadline and grade behavior
- One place to fix late-penalty / attempt bugs
- Slight indirection for Assignment helpers (acceptable)
- Core must stay **I/O-free** (no Mongo / Express) so frontend and worker can reuse helpers later

## Alternatives considered

| Option | Why not |
| --- | --- |
| Copy helpers into each module | Drift; duplicated bugs |
| Single mega “Assessment” Mongo collection for all kinds | Couples unrelated workflows; harder multi-team ownership |
| Wait until after Labs | Labs would entrench duplicate patterns |

## Follow-ups

- Labs (10) consume core for attempts + auto grading method
- Quizzes (12) consume **assessmentQuestionEngine** for question rendering, evaluation, scoring
- Exams (13) reuse **assessmentQuestionEngine** + Coding Engine; add proctoring/scheduling only — do not fork evaluation
- Gradebook (14) consumes `AssessmentGradeResult` shapes
