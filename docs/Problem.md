# Lab Problems

Problems belong to a `PracticeLab` and form the coding problem bank.

## Fields

Title, slug, statement, I/O formats, constraints, samples, explanation, difficulty (`easy|medium|hard`), tags, memory/time limits, allowed languages, boilerplates, optional solution/editorial (faculty-only), order.

## Student visibility

- Public test cases + samples are visible.
- Hidden test cases never expose input/expected output to students.
- `solutionCode` / `editorial` are stripped from student DTOs.

## API

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/practice-labs/problems` | `lab:read` |
| POST | `/practice-labs/problems` | `lab:write` |
| GET | `/practice-labs/problems/:id` | `lab:read` |
| PATCH | `/practice-labs/problems/:id` | `lab:write` |
| DELETE | `/practice-labs/problems/:id` | `lab:write` |
| POST | `/practice-labs/problems/import` | `lab:write` |

## Test cases

| Method | Path |
| --- | --- |
| GET | `/practice-labs/problems/:problemId/test-cases` |
| POST | `/practice-labs/test-cases` |
| PATCH/DELETE | `/practice-labs/test-cases/:id` |

Visibility: `public` | `hidden`. Weight contributes to submission score.
