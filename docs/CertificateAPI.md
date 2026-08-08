# Certificate API

Base path: `/api/v1/certificates`

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/verify?code=` | Verify certificate or transcript by code |

## Authenticated

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/templates` | read | List institution templates |
| POST | `/templates` | manage | Create template |
| PUT | `/templates/:templateId` | manage | Update template |
| GET | `/` | read | List certificates |
| GET | `/:certificateId` | read | Certificate detail |
| POST | `/issue` | write | Issue single certificate |
| POST | `/bulk-issue` | write | Bulk course completion issue |
| POST | `/revoke` | manage | Revoke certificate |
| POST | `/transcripts` | write | Issue transcript |
| GET | `/transcripts` | read | List transcripts |
| GET | `/dashboard/institution` | manage | Issuance stats |
| GET | `/dashboard/student` | read | Student wallet |

## Issue body example

```json
{
  "studentId": "...",
  "documentType": "course_completion",
  "courseId": "..."
}
```

## Events

- `certificate.generated`
- `certificate.revoked`
