# Assignment API

Base path: `/api/v1/assignments`  
Auth: Bearer access token · cookies supported  
Permissions: `assignment:read` | `assignment:write` | `assignment:manage`

## Assignments

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/assignments` | read | List / filter |
| GET | `/assignments/search` | read | Search |
| GET | `/assignments/me` | read | Student enrolled published list |
| GET | `/assignments/stats` | manage | Institution stats |
| GET | `/assignments/export` | read | Export json/csv |
| GET | `/assignments/audit` | manage | Audit log |
| GET | `/assignments/:id` | read | Get one |
| POST | `/assignments` | write | Create (draft) |
| PATCH | `/assignments/:id` | write | Update |
| DELETE | `/assignments/:id` | write | Soft delete |
| POST | `/assignments/:id/publish` | write | Publish |
| POST | `/assignments/:id/archive` | write | Archive |
| POST | `/assignments/:id/close` | write | Close |
| POST | `/assignments/:id/attachments` | write | Upload assignment file (base64) |
| POST | `/assignments/import` | manage | Bulk import |

## Dashboards

| Method | Path | Perm |
| --- | --- | --- |
| GET | `/assignments/dashboard/faculty` | read |
| GET | `/assignments/dashboard/student` | read |
| GET | `/assignments/dashboard/institution` | manage |

## Submissions

| Method | Path | Perm | Description |
| --- | --- | --- | --- |
| GET | `/assignments/submissions` | read | List / filter |
| GET | `/assignments/submissions/:id` | read | Get one |
| POST | `/assignments/submissions/draft` | write | Save draft |
| POST | `/assignments/submissions/submit` | write | Submit attempt |
| POST | `/assignments/submissions/:id/grade` | write | Grade |
| POST | `/assignments/submissions/:id/files` | write | Upload submission file |

## Rubrics

| Method | Path | Perm |
| --- | --- | --- |
| GET | `/assignments/rubrics` | read |
| POST | `/assignments/rubrics` | write |
| GET | `/assignments/rubrics/:id` | read |
| PATCH | `/assignments/rubrics/:id` | write |
| DELETE | `/assignments/rubrics/:id` | write |

## Comments

| Method | Path | Perm |
| --- | --- | --- |
| GET | `/assignments/:id/comments` | read |
| POST | `/assignments/:id/comments` | write |

## Query filters (list)

`q`, `courseId`, `moduleId`, `lessonId`, `status`, `assignmentType`, `published`, `due`, `late`, `graded`, `studentId`, `createdBy`, `page`, `limit`, `sortBy`, `sortOrder`

## File upload body

```json
{
  "fileName": "essay.pdf",
  "contentType": "application/pdf",
  "data": "<base64>"
}
```

Max size ~50MB decoded. Allowed: PDF, DOC/DOCX, ZIP, JPEG/PNG/WEBP/GIF, MP4/WEBM/MOV.

## Domain events

`assignment.created` · `assignment.updated` · `assignment.deleted` · `assignment.published` · `submission.created` · `submission.graded` · `feedback.added`

Interactive docs: `http://localhost:4000/docs` (when OpenAPI includes assignments).
