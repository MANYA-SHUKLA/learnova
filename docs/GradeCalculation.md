# Grade Calculation

Gradebook **never re-scores** upstream modules. Calculation flow:

```
Source modules produce normalized scores
        ↓
GradebookEntry (GradebookItem) — one row per consumed source record
        ↓
AssessmentWeight — category weights (assignments, labs, quizzes, midterm, final, projects, attendance, extra credit)
        ↓
Weighted percentage = Σ(entry.percentage × entry.weightage) / Σ(weightage)
        ↓
Letter grade + grade points + pass/fail result
        ↓
CourseGrade (Gradebook record)
        ↓
SemesterGrade (GPA) → CGPARecord
```

## Weight distribution

Within each category bucket, weight is split **evenly** across consumed entries for that student.

Exam entries use `metadata.examType`:

- `midterm` → midterm weight bucket
- `final` → final exam weight bucket
- other → general exam weight bucket

## Locking

When `locked: true`, sync/ingest skips that student's course grade. Institution admins may unlock with a documented reason.

## Publishing

Students only see summaries where `published: true`. Faculty publish after review; finalize (admin) publishes and locks in one step.

See [GradeScales](./GradeScales.md) for letter bands and grade points.
