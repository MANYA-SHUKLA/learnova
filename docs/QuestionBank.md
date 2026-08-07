# Question Bank

Institution-scoped reusable question pools. Faculty and admins create questions once and attach them to multiple quizzes via the Quiz Builder.

## Overview

```
Question Bank → Questions → Categories & Tags → Quiz sections
```

Each **QuestionBank** belongs to an institution and holds a collection of **Question** documents. Banks can be categorized and tagged for discovery; questions carry their own inline tags and optional category string.

## Question bank model

| Field | Description |
| --- | --- |
| `title` | Bank name (required) |
| `slug` | Unique per institution |
| `description` | Optional summary |
| `status` | `active` · `archived` |
| `questionCount` | Denormalized count |
| `categoryIds` | Refs to `QuestionCategory` |
| `tagIds` | Refs to `QuestionTag` |

## Question types

| Type | Scoring |
| --- | --- |
| `single_choice` | One correct option |
| `multiple_choice` | All correct options must be selected |
| `true_false` | Boolean choice |
| `assertion_reason` | Assertion + reason pair (MCQ-style) |
| `match_following` | Match left/right pairs |
| `fill_blank` | Text answer(s), normalized comparison |

Each question includes: stem, optional description, difficulty (`easy` · `medium` · `hard`), marks, optional negative marks, explanation (text + media URL), hint, options/match pairs/fill-blank answers, and attachments.

## Categories

Institution-wide taxonomy for organizing banks.

| Endpoint | Action |
| --- | --- |
| `GET /question-categories` | List |
| `POST /question-categories` | Create `{ name, description? }` |
| `PATCH /question-categories/:id` | Update |
| `DELETE /question-categories/:id` | Delete |

Banks link via `categoryIds[]`. Questions may also carry a free-text `category` field for inline filtering.

## Tags

Lightweight labels for banks and inline question tags.

| Endpoint | Action |
| --- | --- |
| `GET /question-tags` | List |
| `POST /question-tags` | Create `{ name }` |
| `PATCH /question-tags/:id` | Update |
| `DELETE /question-tags/:id` | Delete |

Questions store tags as `string[]` (max 20). List questions supports `?tag=` and `?category=` filters.

## Bank operations

| Action | Endpoint | Permission |
| --- | --- | --- |
| List banks | `GET /question-banks` | read |
| Create | `POST /question-banks` | write |
| Get one | `GET /question-banks/:id` | read |
| Update | `PATCH /question-banks/:id` | write |
| Archive | `POST /question-banks/:id/archive` | write |
| Duplicate | `POST /question-banks/:id/duplicate` | write |

## Question operations

| Action | Endpoint | Permission |
| --- | --- | --- |
| List / filter | `GET /questions` | read |
| Create | `POST /questions` | write |
| Get one | `GET /questions/:id` | read |
| Update | `PATCH /questions/:id` | write |
| Delete | `DELETE /questions/:id` | write |
| Duplicate | `POST /questions/:id/duplicate` | write |

### List filters

`q`, `questionBankId`, `questionType`, `difficulty`, `category`, `tag`, `page`, `limit`, `sortBy`, `sortOrder`

## Import / export

### Quiz-level export (includes question refs)

| Method | Path | Format |
| --- | --- | --- |
| GET | `/quizzes/export?format=json\|csv` | JSON or CSV |

CSV headers: `id`, `title`, `courseId`, `quizType`, `status`, `difficulty`, `totalMarks`, `durationMinutes`, `questionCount`.

### Quiz import (institution admin)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/quizzes/import/preview` | Validate up to 100 quiz payloads; returns `importId` |
| POST | `/quizzes/import` | Confirm with `{ importId, confirm: true }` |

Import creates quizzes (and sections) but references existing question IDs — bulk question import is done by seeding or manual CRUD. Question banks do not have a dedicated CSV import endpoint in Step 12; use the quiz import pipeline or API CRUD.

## Scoping

- **Institution admin** — all banks in tenant
- **Faculty** — create and manage banks; use questions in own-course quizzes
- **Student** — no bank management; questions rendered only during attempts

## UI routes

| Role | Path |
| --- | --- |
| Institution | `/institution/question-bank` |
| Faculty | `/faculty/question-bank` |

## Related docs

- [QuizManagement.md](./QuizManagement.md)
- [QuizBuilder.md](./QuizBuilder.md)
- [QuizAPI.md](./QuizAPI.md)
- [QuizPermissions.md](./QuizPermissions.md)
