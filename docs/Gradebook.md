# Gradebook — Enterprise Academic Results

The Gradebook is the **single source of truth** for academic results. It does **not** calculate quiz, exam, lab, or assignment scores. It **consumes** normalized results produced by upstream modules.

## Architecture

```
Assignments (9)     ──► assignment_grades
Practice Labs (10)  ──► lab_progress (successRate, problemsSolved)
Projects (11)       ──► project_grades (+ gradebook assign flow)
Quizzes (12)        ──► quiz_results
Exams (13)          ──► exam_results (released only)
         │
         ▼
   GradebookEntry (normalized snapshot + source ref)
         │
         ▼
   CourseGradeSummary (weighted aggregation of percentages)
```

### Hard rules

1. **No re-scoring** — Gradebook never runs Judge0, the question engine, or assignment rubric evaluation.
2. **Read-only adapters** — Source module services remain authoritative for raw attempts and scoring logic.
3. **One write exception** — `assignProjectGrade` creates/updates `ProjectGrade` when faculty exports marks from a `ready` submission.
4. **Aggregation only** — `aggregateWeightedPercentage` combines already-normalized percentages using course weight schemes.

## Data model

| Collection | Purpose |
| --- | --- |
| `gradebook_entries` | Consumed grade row per source record (`sourceCollection` + `sourceRefId` unique) |
| `course_grade_summaries` | Per student/course weighted percentage + letter grade |
| `gradebook_weight_schemes` | Category weights (assignment/lab/quiz/exam/project) + attempt policy |
| `gradebook_audit_logs` | Ingest, sync, finalize, project grade events |

## Weight scheme

Default category weights (must sum to 100):

| Category | Default % |
| --- | --- |
| Assignments | 25 |
| Practice labs | 10 |
| Quizzes | 15 |
| Exams | 30 |
| Projects | 20 |

Within each category, weight is split evenly across consumed entries for that student.

## Quiz attempt policy

When multiple quiz attempts exist, gradebook selects one result per student/quiz:

- `best` — highest percentage (default)
- `latest` — most recent attempt
- `average` — average percentage across attempts

## Exam release gate

Only `exam_results` with `releasedAt` set are ingested. Unreleased exam scores never appear in the gradebook.

## Project grading flow

1. Project module marks submission `evaluationStatus: ready`
2. Faculty calls `POST /gradebook/project/grade`
3. Gradebook writes `ProjectGrade`, ingests entry, sets submission `evaluationStatus: exported`

## Sync workflow

`POST /gradebook/sync` scans all source records for a course, upserts entries, recomputes summaries.

Institution admins may `POST /gradebook/finalize` to lock summaries after sync.

## Related docs

- [GradebookAPI](./GradebookAPI.md)
- [GradebookPermissions](./GradebookPermissions.md)
