# Certificate API

Base path: `/api/v1`

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/verify/:verificationCode` | Verify certificate or transcript |
| GET | `/certificate/:certificateNumber` | Public certificate summary |
| GET | `/certificates/verify?code=` | Verify (query alias) |

## Templates (manage)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/certificates/templates` | `certificate:read` |
| POST | `/certificates/templates` | `certificate:manage` |
| PUT | `/certificates/templates/:templateId` | `certificate:manage` |

## Certificates

| Method | Path | Permission |
|--------|------|------------|
| GET | `/certificates` | `certificate:read` |
| GET | `/certificates/:certificateId` | `certificate:read` |
| GET | `/certificates/:certificateId/download` | `certificate:read` |
| POST | `/certificates/issue` | `certificate:write` |
| POST | `/certificates/bulk-issue` | `certificate:write` / manage actions |
| POST | `/certificates/publish` | `certificate:manage` |
| POST | `/certificates/revoke` | `certificate:manage` |
| POST | `/certificates/:certificateId/archive` | `certificate:manage` |
| POST | `/certificates/:certificateId/regenerate` | `certificate:manage` |
| GET | `/certificates/eligible-students?courseId=` | `certificate:write` |
| GET | `/certificates/registry/export` | `certificate:manage` |

## Transcripts & academic records

| Method | Path | Permission |
|--------|------|------------|
| POST | `/certificates/transcripts` | `certificate:write` |
| GET | `/certificates/transcripts` | `certificate:read` |
| GET | `/certificates/academic-record` | `certificate:read` |
| POST | `/certificates/academic-record` | `certificate:write` |

## Dashboards

| Method | Path | Permission |
|--------|------|------------|
| GET | `/certificates/dashboard/institution` | `certificate:manage` |
| GET | `/certificates/dashboard/student` | `certificate:read` |

## Bulk actions

`POST /certificates/bulk-issue` accepts `action`: `generate`, `issue`, `publish`, `revoke`, `archive`.

## Seed

```bash
pnpm --filter @learnova/backend seed:certificates
```

Requires `SEED_INSTITUTION_ID` and published gradebook data (`seed:gradebook` first).

## Related docs

- [Certificates](./Certificates.md)
- [CertificateTemplates](./CertificateTemplates.md)
- [Transcript](./Transcript.md)
- [Verification](./Verification.md)
- [CertificatePermissions](./CertificatePermissions.md)
