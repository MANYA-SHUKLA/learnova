# Certificate Verification

Every certificate and transcript includes QR-ready verification metadata.

## Verification artifacts

| Field | Description |
|-------|-------------|
| `verificationCode` | Unique `LN-` prefixed code |
| `verificationURL` | Public portal URL (`/verify/:code`) |
| `certificateNumber` | Registry number (`LNV-2026-CERT-0000001`) |

## Public endpoints (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/verify/:verificationCode` | Validate by code |
| GET | `/api/v1/certificate/:certificateNumber` | Read-only certificate lookup |
| GET | `/api/v1/certificates/verify?code=` | Legacy query alias |

Valid statuses: `issued`, `published`. Revoked documents return `valid: false`.

## Verification logging

Each check writes to `CertificateVerificationLog` with IP, user agent, and result. Institution analytics include verification request counts.

## Frontend portal

Public page: `/verify/:verificationCode` (locale-aware under `(public)` layout).

## Audit

- `verification.checked` — verification attempt recorded

See [Certificates](./Certificates.md) and [CertificateAPI](./CertificateAPI.md).
