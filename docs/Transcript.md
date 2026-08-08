# Transcripts

Official transcripts are generated from **published gradebook records** only.

## Transcript types

| Type | Scope |
|------|--------|
| `semester` | Single semester published grades |
| `complete` | Full academic history |
| `course_wise` | Course-filtered extract |
| `official` | Institution-stamped official document |

## Fields

Each transcript includes:

- `transcriptNumber` — unique registry identifier (`LNV-2026-TRN-0000001`)
- `verificationCode` / `verificationURL` — public validation
- `semesterGpa`, `cgpa`, `academicStanding` — read from gradebook models
- `courses[]` — published course rows (letter grade, credits, result)
- `version` — incremented on regeneration; prior versions remain immutable

## API

- `POST /api/v1/certificates/transcripts` — issue transcript
- `GET /api/v1/certificates/transcripts` — list (scoped by role)
- `GET /api/v1/certificates/academic-record` — consolidated academic record
- `POST /api/v1/certificates/academic-record` — snapshot academic record + version

## Audit

- `transcript.generated` — transcript document created
- `academic_record.generated` — academic record version frozen

See [AcademicRecords](./AcademicRecords.md) and [CertificateAPI](./CertificateAPI.md).
