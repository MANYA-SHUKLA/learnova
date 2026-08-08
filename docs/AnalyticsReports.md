# Analytics & reports (v1.0)

Step 16 is **read-only reporting** — aggregation over data that already exists. It does not rescore exams, recalculate grades, or run AI analysis.

---

## Who sees what

| Role | Page | API |
| --- | --- | --- |
| Institution admin | `/institution/reports` | `GET /reports/institution` |
| Faculty | `/faculty/reports` | `GET /reports/faculty?courseId=...` (course required) |
| Student | `/student/reports` | `GET /reports/student` |

Exports (CSV, Excel, PDF): `GET /reports/export?scope=...&format=csv|excel|pdf`

Permission: `analytics:read` (view), `analytics:export` (download).

---

## Institution report includes

- Total students, faculty, active courses
- Course completion rates
- Exam pass percentage
- Department and semester breakdowns (when data exists)

## Faculty report includes

- Course progress and assignment completion
- Exam stats for the selected course
- Student performance snapshot

## Student report includes

- Learning progress across enrollments
- Grade summary
- Completed courses count

Attendance is noted where the product only has exam check-in data — not full class attendance.

---

## What this is not

- Not Step 17 AI content generation
- Not a BI warehouse or custom SQL builder
- Not real-time streaming analytics

For gradebook-specific exports (matrices, appeals), see [Gradebook.md](./Gradebook.md) and [Reports.md](./Reports.md) (gradebook report types).

---

## Smoke test

```bash
pnpm verify:platform
```

Look for `=== Reports (Step 16) ===` in the output.
