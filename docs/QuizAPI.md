# Quiz API

Base path: `/api/v1`  
Auth: Bearer access token · cookies supported  
Permissions: `quiz:read` | `quiz:write` | `quiz:manage`

## Quizzes

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/quizzes` | read | List / filter |
| GET | `/quizzes/search` | read | Search |
| GET | `/quizzes/stats` | manage | Institution stats |
| GET | `/quizzes/audit` | manage | Audit log |
| GET | `/quizzes/export` | read | Export json/csv |
| POST | `/quizzes/import/preview` | manage | Validate import batch |
| POST | `/quizzes/import` | manage | Confirm import |
| POST | `/quizzes/bulk` | write | Bulk publish/archive/duplicate/delete/assign_faculty |
| GET | `/quizzes/:id` | read | Get one |
| POST | `/quizzes` | write | Create (draft) |
| PATCH | `/quizzes/:id` | write | Update |
| DELETE | `/quizzes/:id` | write | Soft delete |
| POST | `/quizzes/:id/publish` | write | Publish |
| POST | `/quizzes/:id/archive` | write | Archive |
| POST | `/quizzes/:id/close` | write | Close |
| POST | `/quizzes/:id/duplicate` | write | Duplicate |
| GET | `/quizzes/:id/analytics` | read | Per-quiz analytics |

## Dashboards

| Method | Path | Perm |
| --- | --- | --- |
| GET | `/quizzes/dashboard/faculty` | read |
| GET | `/quizzes/dashboard/student` | read |
| GET | `/quizzes/dashboard/institution` | manage |

## Question banks

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/question-banks` | read | List |
| POST | `/question-banks` | write | Create |
| GET | `/question-banks/:id` | read | Get one |
| PATCH | `/question-banks/:id` | write | Update |
| POST | `/question-banks/:id/archive` | write | Archive |
| POST | `/question-banks/:id/duplicate` | write | Duplicate |

## Questions

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/questions` | read | List / filter |
| POST | `/questions` | write | Create |
| GET | `/questions/:id` | read | Get one |
| PATCH | `/questions/:id` | write | Update |
| DELETE | `/questions/:id` | write | Soft delete |
| POST | `/questions/:id/duplicate` | write | Duplicate |

## Categories & tags

| Method | Path | Perm |
| --- | --- | --- |
| GET | `/question-categories` | read |
| POST | `/question-categories` | write |
| PATCH | `/question-categories/:id` | write |
| DELETE | `/question-categories/:id` | write |
| GET | `/question-tags` | read |
| POST | `/question-tags` | write |
| PATCH | `/question-tags/:id` | write |
| DELETE | `/question-tags/:id` | write |

## Attempts

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/attempts` | read | List / filter |
| POST | `/attempts/start` | write | Start attempt `{ quizId }` |
| POST | `/attempts/submit` | write | Submit quiz `{ attemptId, answers[] }` |
| GET | `/attempts/:id` | read | Get attempt |
| POST | `/attempts/:id/answers` | write | Save single answer (incremental) |

## Analytics

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/analytics/quizzes/:id` | read | Per-quiz analytics (alias) |

## Query filters (quiz list)

`q`, `courseId`, `moduleId`, `lessonId`, `status`, `quizType`, `difficulty`, `published`, `createdBy`, `page`, `limit`, `sortBy`, `sortOrder`

## Bulk action body

```json
{
  "ids": ["<ObjectId>", "..."],
  "action": "publish | archive | duplicate | delete | assign_faculty",
  "facultyId": "<ObjectId>"
}
```

`facultyId` required when `action` is `assign_faculty`.

## Submit answer body

```json
{
  "questionId": "<ObjectId>",
  "selectedOptionIds": ["<optionId>"],
  "textAnswer": "optional fill-blank text",
  "matchAnswers": { "<leftId>": "<rightId>" },
  "timeSpentSeconds": 42
}
```

## Domain events

`quiz.created` · `quiz.updated` · `quiz.deleted` · `quiz.published` · `quiz.started` · `quiz.completed`

Interactive docs: `http://localhost:4000/docs` (when OpenAPI includes quizzes).
