# Practice Labs

Enterprise coding practice environment integrated into the Learnova LMS (Step **10**).

Students write code in-browser (Monaco), run against public samples, submit against hidden tests via **Judge0**, and track progress. Faculty author labs and problems. Institution admins oversee platform analytics.

This is **not** an exam, quiz, or assignment — it is a practice platform.

## Architecture

```
Student / Faculty UI (Monaco)
  → Express API (/api/v1/practice-labs)
  → PracticeLabService   (lab authorship, permissions, progress UX)
  → Coding Assessment Engine   (run / evaluate / languages / scoring / history)
  → Judge0 CE (Docker-isolated)  [or offline mock when JUDGE0_API_URL unset]
  → MongoDB (labs, problems, tests, submissions, history, progress)
  → Socket.IO /practice (execution status)
  → BullMQ compile queue (async execution jobs)
```

Practice Lab is a **consumer** of the [Coding Assessment Engine](./CodingEngine.md). Coding Exams must reuse that engine rather than adding a second runner.

## Models

| Collection | Purpose |
| --- | --- |
| `practice_labs` | Lab metadata, course linkage, languages, limits |
| `lab_problems` | Problem bank entries |
| `problem_test_cases` | Public + hidden cases |
| `student_code_submissions` | Graded submissions |
| `execution_histories` | Run/submit snapshots |
| `practice_languages` | Language catalog (Judge0 + Monaco ids) |
| `lab_progress` | Per-student lab progress |
| `practice_lab_audit_logs` | Module audit trail |

## Permissions

Uses Assessment Core triad:

| Permission | Roles |
| --- | --- |
| `lab:read` | student, faculty, institution_admin |
| `lab:write` | student (run/submit), faculty (own labs), institution_admin |
| `lab:manage` | institution_admin |

Faculty may only mutate labs they created. Students only see **published** labs for enrolled courses and only their own attempts.

## Assessment Core

Lifecycle transitions, attempt limits, and enrollment gates reuse `@learnova/shared` assessment helpers. Grading method for labs is effectively `auto` via Judge0 + weighted test cases.

## UI routes

- `/institution/practice-labs`
- `/institution/practice-labs/create`
- `/institution/practice-labs/:id`
- `/institution/practice-labs/:id/problems`
- `/faculty/practice-labs`
- `/student/practice-labs`
- `/student/practice-labs/:problemId`
- `/student/submissions`

## Seed

```bash
pnpm --filter @learnova/backend seed:practice-labs
# SEED_FORCE=1 to replace
```

Targets: 30 labs · 300 problems · ~5000 test cases · ~10000 submissions.

## Related

- [CodingEngine.md](./CodingEngine.md) — shared execution infrastructure (required for exams)
- [Problem.md](./Problem.md)
- [Judge0.md](./Judge0.md)
- [Execution.md](./Execution.md)
- [PracticeSubmission.md](./PracticeSubmission.md)
- [Leaderboard.md](./Leaderboard.md)
- [AssessmentCore.md](./AssessmentCore.md)
- [ADR 0005 — Code Runner](./adr/0005-code-runner.md)
