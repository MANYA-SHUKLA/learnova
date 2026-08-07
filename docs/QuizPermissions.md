# Quiz Permissions

Enterprise quiz management uses three permission keys scoped by role and enrollment.

## Permission keys

| Permission | Description |
| --- | --- |
| `quiz:read` | View quizzes, question banks, attempts, results, analytics |
| `quiz:write` | Create/update quizzes and questions; start and submit attempts |
| `quiz:manage` | Institution-wide CRUD, bulk ops, import, stats, audit |

## Role matrix

| Action | student | faculty | institution_admin | teaching_assistant |
| --- | --- | --- | --- | --- |
| View published quizzes (enrolled) | ✓ | ✓ | ✓ | ✓ |
| Create / edit quizzes | — | ✓ (own/courses) | ✓ | ✓ |
| Manage question banks | — | ✓ | ✓ | ✓ |
| Start / submit attempts | ✓ | — | — | — |
| Save incremental answers | ✓ | — | — | — |
| View own attempt results | ✓ | — | — | — |
| Per-quiz analytics | — | ✓ (scoped) | ✓ | ✓ |
| Bulk publish / archive / delete | — | — | ✓ | — |
| Bulk assign faculty | — | — | ✓ | — |
| Institution stats / audit | — | — | ✓ | — |
| Import / export quizzes | — | — | ✓ | — |
| Institution dashboard | — | — | ✓ | — |

## Scoping rules

- **Institution admin** — all quizzes and banks in tenant; bulk ops; dashboards; import; audit
- **Faculty** — quizzes for assigned courses and own drafts; question bank CRUD; faculty dashboard; cannot see other faculty drafts
- **Student** — published quizzes for enrolled courses only; own attempts and results; read + write (for attempts) but never manage

## Manage-only endpoints

These require `quiz:manage` (institution admin only):

- `GET /quizzes/stats`
- `GET /quizzes/audit`
- `GET /quizzes/dashboard/institution`
- `POST /quizzes/import/preview`
- `POST /quizzes/import`

## Frontend gates

Pages use `PermissionGate` with `PERMISSIONS.QUIZ_READ`, `QUIZ_WRITE`, or `QUIZ_MANAGE` from `@learnova/constants`.

## API enforcement

Routes in `apps/backend/src/routes/v1/quiz.routes.ts` apply:

- `QUIZ_READ` — list, get, dashboards (faculty/student), analytics, export
- `QUIZ_WRITE` — create, update, publish, attempts, bulk (non-manage actions)
- `QUIZ_MANAGE` — stats, audit, institution dashboard, import
