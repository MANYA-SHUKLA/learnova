# Gradebook Academic Policies

Institution-level academic policy configures how consumed assessment results become official grades.

## Configuration

| Setting | Description |
|---------|-------------|
| `creditBasedGrading` | Enables credit-weighted GPA/CGPA calculations |
| `passingCriteria` | `marks`, `grade`, or `both` |
| `passingPercentage` / `passingGradeLetters` | Thresholds for pass/fail |
| `gradingScheme` | `absolute` (fixed scale) or `relative` (percentile-based letters) |
| `gpaFormula` / `cgpaFormula` | `credit_weighted`, `arithmetic_mean`, or `cumulative_credits` |
| `gradeReplacementPolicy` | How make-up/improvement attempts replace regular exam grades |
| `makeupAttemptPolicy` / `improvementAttemptPolicy` | Best/latest/average within each attempt type |

## API

- `GET /api/v1/gradebook/policy` — read policy (defaults when unset)
- `PUT /api/v1/gradebook/policy` — upsert policy (`gradebook:manage`)

Policy is applied during course summary recomputation and semester/CGPA recomputation.

## Make-up & Improvement

Exam ingestion tags entries with `metadata.assessmentPurpose` (`regular`, `supplementary`, `improvement`). During aggregation, exam attempts for the same activity are collapsed using institutional replacement rules before weighted totals are computed.
