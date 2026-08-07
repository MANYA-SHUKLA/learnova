# Examination Permissions

Uses existing `examination:*` permissions (defined before Step 13).

| Permission | Institution | Faculty | Student |
| --- | --- | --- | --- |
| `examination:read` | ✓ | ✓ | ✓ |
| `examination:write` | ✓ | ✓ | ✓ (attempts only) |
| `examination:manage` | ✓ | — | — |
| `examination:proctor` | ✓ | ✓ | — |

## Scoping

- **Institution admin** — all exams in tenant
- **Faculty** — exams for courses they coordinate or teach
- **Student** — published exams for enrolled courses; own attempts only
- **Proctor** — faculty/institution with `examination:proctor`; can flag/terminate attempts they monitor

Question bank CRUD remains under `quiz:write` — exams **reference** questions by ID.
