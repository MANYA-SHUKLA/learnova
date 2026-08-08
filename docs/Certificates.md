# Certificates & Academic Records

Step **15** — enterprise certificate and academic record management. Documents are generated **only** from published gradebook records.

```
Published Gradebook → Eligibility → Certificate / Transcript → Verification → Registry
```

## Document types

| Type | Gradebook source |
|------|------------------|
| Course completion | Published `CourseGradeSummary` (`result: pass`) |
| Lab / project / quiz / exam completion | Published summary + matching `GradebookEntry` activity |
| Semester / program / graduation | Published summaries + enrollment completeness |
| Merit / honors / distiction | `AcademicStanding` |
| Participation / custom | Published grade reference |
| Transcript | Published summaries + GPA / CGPA / standing |

## Certificate lifecycle

`draft` → `generated` → `issued` → `published` → (`revoked` | `archived`)

- **Regeneration** archives the prior version and issues a new immutable version with a new number.
- **Revocation** sets `revoked: true`; verification returns invalid.

## Numbering

- Certificates: `{prefix}-{year}-CERT-{7-digit-seq}` (default `LNV-2026-CERT-0000001`)
- Transcripts: `{prefix}-{year}-TRN-{7-digit-seq}`

## Features

- Template design with signatures, watermark, branding
- HTML/PDF export (print-ready HTML)
- QR verification codes and public portal
- Registry CSV export
- Bulk issue / publish / revoke / archive
- Academic record versioning
- Certificate-module analytics (issued, revoked, downloads, verifications, top programs/courses)

## Hard rules

1. **No grade calculation** in the certificate module — marks, GPA, CGPA, and standing are read from gradebook models only.
2. **Published gradebook only** for eligibility.
3. **Eligibility engine** — [CertificateEligibility](./CertificateEligibility.md) checks published records, policy outcomes (via gradebook), standing, and completion requirements. It never recomputes grades.
4. **Do not modify** assessment or gradebook modules from certificates.

## v1.0 scope (Step 15 — complete)

What ships:

| Capability | Who |
| --- | --- |
| **Issue** (manual, bulk, auto on grade publish) | Institution admin, faculty |
| **Revoke** (with reason, audit logged) | Institution admin only |
| **Verify** (public portal + QR code on PDF) | Anyone with verification code |
| **Download** (print-ready HTML → Save as PDF) | Admin, faculty, student (own docs) |
| Templates, registry export, audit log | Institution admin |

What is **intentionally not built**:

- Faculty “recommend certificate” workflow (no pending recommendations queue)
- Student nomination or peer endorsements
- Certificate marketplace or external issuer integrations

Faculty **issue directly** to eligible students (published passing grades). Admins **revoke** when a document must be invalidated. Employers and registrars **verify** via `/verify/{code}`.

## Seed

```bash
pnpm --filter @learnova/backend seed:gradebook
pnpm --filter @learnova/backend seed:certificates
```

Targets ~1000 certificates, ~500 transcripts, multiple templates.

## Related docs

- [CertificateEligibility](./CertificateEligibility.md)
- [CertificateAPI](./CertificateAPI.md)
- [CertificateTemplates](./CertificateTemplates.md)
- [Transcript](./Transcript.md)
- [Verification](./Verification.md)
- [CertificatePermissions](./CertificatePermissions.md)
- [AcademicRecords](./AcademicRecords.md)
