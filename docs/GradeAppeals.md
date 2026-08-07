# Grade Appeals

## Flow

1. Student submits appeal against a **published** course grade
2. Status: `pending` → `under_review` → `accepted` | `rejected`
3. Faculty resolves with optional resolution notes
4. All actions recorded in grade audit + history

## API

- `POST /api/v1/gradebook/appeals` — student submit
- `GET /api/v1/gradebook/appeals` — list (scoped by role)
- `POST /api/v1/gradebook/appeals/resolve` — faculty/admin resolve

## Permissions

- Students: create + list own appeals
- Faculty: list course appeals, resolve
- Institution admin: full access

Domain events: `grade.appeal.created`, `grade.appeal.resolved`
