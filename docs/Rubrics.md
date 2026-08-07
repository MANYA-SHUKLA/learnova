# Assignment Rubrics

Reusable scoring frameworks for rubric-based grading.

## Model

- `title`, `description`
- `criteria[]`: `id`, `title`, `description`, `weight`, `maxPoints`
- `totalPoints` (sum of criterion maxPoints)
- `reusable` flag (institution library)

## Grading with rubrics

`POST /assignments/submissions/:id/grade` with:

```json
{
  "gradingMethod": "rubric",
  "rubricScores": [
    { "criterionId": "…", "points": 8, "comment": "Strong analysis" }
  ],
  "feedback": "Overall…"
}
```

Marks / percentage / pass-fail can be derived or supplied alongside.

## Permissions

Faculty and institution admins with `assignment:write` / `assignment:manage` create and edit rubrics. Students do not manage rubrics.

## See also

[Assignment.md](./Assignment.md) · [Submission.md](./Submission.md)
