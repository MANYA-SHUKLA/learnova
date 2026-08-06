# Institution Settings

Tenant configuration for operational defaults. Stored in `institution_settings` (one document per institution).

## Fields

| Field | Purpose |
| --- | --- |
| `language` | Default locale (e.g. `en`) |
| `theme` | `system` \| `light` \| `dark` (string) |
| `attendance` | Attendance policy JSON |
| `gradingScale` | Grading scale JSON |
| `examRules` | Examination rules JSON |
| `certificateSettings` | Certificate template / issuance JSON |
| `storageSettings` | Storage quotas / providers JSON |
| `aiSettings` | AI feature toggles JSON (config only) |
| `notificationSettings` | Notification preference JSON |
| `securitySettings` | Security policy JSON |

Policy blocks are opaque JSON objects validated as `z.record(z.unknown())`. Domain enforcement for exams/AI/certificates belongs to later modules.

## API

- `GET /api/v1/institution-settings` — read (`institution:read`)
- `PUT|PATCH /api/v1/institution-settings` — update (`institution:manage`)

Auto-created on first institution create / first settings read.

## UI

`/institution/settings` — language, theme, and editable JSON policy blocks.

## Audit

`settings.updated` with changed field names in metadata.

## Permissions

Same as institution hierarchy: admin manage, faculty read, student none.
