# Academic Policies

Enterprise academic policy configuration for the Learnova Gradebook aggregation layer.

See also: [GradebookPolicies.md](./GradebookPolicies.md) for API details and field reference.

## Scope

Policies govern **how finalized assessment results become official grades**. The gradebook never rescores assignments, labs, projects, quizzes, or exams — it only applies institutional rules during aggregation.

## Configurable areas

| Area | Options |
|------|---------|
| Credit system | Credit-based vs. non-credit courses |
| Grade scale | Institution-defined letter bands (A+ through F, I, W, AB, U, etc.) |
| Passing marks | Minimum percentage and/or letter |
| GPA / CGPA | Credit-weighted, arithmetic mean, or cumulative credits |
| Semester calculation | Earned vs. attempted credits, failed credit tracking |
| Improvement / repeat | Best, latest, replace-if-higher, keep original |
| Supplementary | Make-up attempt selection (best / latest / average) |
| Grace marks | Applied at moderation publish (manual adjustment entries) |
| Grading scheme | Absolute (fixed scale) or relative (percentile-based) |
| Academic standing | Warning, probation, honors, distinction thresholds |

## Workflow

1. Institution admin configures policy via `PUT /api/v1/gradebook/policy`.
2. Faculty syncs course gradebook (read-only ingestion from assessment modules).
3. Weighted aggregation runs using course weight scheme + academic policy.
4. Moderation workflow publishes frozen snapshots.
5. Semester SGPA, CGPA, and academic standing recompute from published records.

## RBAC

- **Institution**: full policy CRUD (`gradebook:manage`)
- **Faculty**: read policy; cannot change institution rules
- **Student**: read own standing and transcript eligibility only
