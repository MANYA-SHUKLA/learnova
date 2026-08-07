# Practice Lab Submissions

Coding submissions for Practice Labs (Step 10). Distinct from [Assignment submissions](./Submission.md).

## Flow

```
Submit → attempt check (maxSubmissions)
      → load all test cases (incl. hidden)
      → Judge0 per case
      → compare normalized stdout vs expected
      → score + verdict
      → update lab_progress
      → events + audit
```

## Verdicts

`pending` · `accepted` · `wrong_answer` · `compilation_error` · `runtime_error` · `time_limit_exceeded` · `memory_limit_exceeded` · `partial` · `failed`

## Events

- `lab.submission.created`
- `lab.submission.accepted` / `lab.submission.failed`
- `problem.solved`
- `lab.completed` (all problems solved)

## API

| Method | Path |
| --- | --- |
| POST | `/practice-labs/submit` |
| GET | `/practice-labs/submissions` |
| GET | `/practice-labs/submissions/:id` |

See also [Execution.md](./Execution.md) and [Judge0.md](./Judge0.md).
