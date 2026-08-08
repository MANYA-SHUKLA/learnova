# Certificates & Academic Records

Step **15** — official academic documents generated from **published gradebook records only**. This module does **not** calculate grades, run assessments, or modify gradebook data.

```
Published Gradebook → Eligibility Check → Academic Certificate / Transcript → Verification
```

## Document types

| Type | Source data |
|------|-------------|
| Course completion | Published `CourseGradeSummary` with `result: pass` |
| Semester record | All published semester grades + `SemesterGrade` GPA |
| Transcript | Published summaries + `SemesterGrade` / `CGPARecord` / `AcademicStanding` |
| Honors / Distinction | `AcademicStanding` record (must match standing type) |

## Hard rules

1. **No grade calculation** — percentages, letter grades, GPA, and CGPA are read from gradebook models.
2. **Published only** — unpublished or draft grades cannot produce documents.
3. **Immutable issuance** — revocation marks status; history is retained.
4. **Verification** — each certificate/transcript has a unique `LN-` verification code.

## Related docs

- [CertificateAPI](./CertificateAPI.md)
- [CertificatePermissions](./CertificatePermissions.md)
- [AcademicRecords](./AcademicRecords.md)
- [Gradebook](./Gradebook.md)
