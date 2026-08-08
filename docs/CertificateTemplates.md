# Certificate Templates

Institution administrators manage reusable certificate templates before issuance.

## Template fields

| Field | Purpose |
|-------|---------|
| `name` | Template label in admin UI |
| `documentType` | Which certificate types may use this template |
| `titleTemplate` / `bodyTemplate` / `footerTemplate` | Rendered copy for PDF/HTML output |
| `numberPrefix` | Institution prefix for numbers (`LNV-2026-CERT-0000001`) |
| `design` | Header/footer HTML, logo, seal, watermark, colors, typography |
| `signatures[]` | Registrar, dean, faculty, institution roles |

## Rules

- Templates do **not** alter grades or eligibility.
- Signatures are copied onto each issued certificate as immutable signature rows.
- Inactive templates remain in history but cannot be selected for new issuance.

## API

- `GET /api/v1/certificates/templates`
- `POST /api/v1/certificates/templates`
- `PUT /api/v1/certificates/templates/:templateId`

See [CertificateAPI](./CertificateAPI.md).
