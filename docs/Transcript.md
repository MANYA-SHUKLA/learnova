# Transcript requests (Step 14)

Gradebook owns the **transcript request workflow**. Official PDF generation and certificate-style verification are Step 15 — gradebook only tracks requests and completion status.

## Flow

```
Student submits request (pending)
        ↓
Faculty / institution reviews (approved | rejected)
        ↓
Institution marks completed → transcript.generated event
        ↓
Step 15 may attach AcademicTranscript document
```

## API

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/v1/gradebook/transcript-requests` | Student |
| `GET` | `/api/v1/gradebook/transcript-requests` | All (scoped) |
| `POST` | `/api/v1/gradebook/transcript-requests/review` | Faculty / admin |

## Model

`TranscriptRequest` (`transcript_requests` collection):

- `requestType`: `official` | `semester` | `complete`
- `status`: `pending` | `approved` | `rejected` | `completed`
- Optional link to `AcademicTranscript` when Step 15 issues the document

## Frontend

- Faculty: `/faculty/transcripts`
- Student transcript view: `/student/transcript` (Step 15 certificate module)

See also [Gradebook.md](./Gradebook.md) and [GradebookAPI.md](./GradebookAPI.md).
