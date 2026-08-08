# Academic Records

Official transcripts and semester records are structured JSON payloads ready for PDF rendering (Step 15 stores payloads; PDF wiring uses `@learnova/utils` when enabled).

## Transcript rows

Each row is copied from a published course grade summary:

- Course code/title/credits (from course catalog)
- Letter grade, grade points, percentage, result (from gradebook)
- Published timestamp and semester linkage

## GPA & standing

- `semesterGpa` — from `SemesterGrade` (computed by gradebook)
- `cgpa` — from `CGPARecord` (computed by gradebook)
- `academicStanding` — from `AcademicStanding` (computed by gradebook policies)

The certificate module never recomputes these values.

## Revocation

Revoked transcripts and certificates remain in the database with `status: revoked` and remain verifiable with an invalid status message.
