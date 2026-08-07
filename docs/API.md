# API Documentation (Swagger)

Interactive OpenAPI docs are served by the backend:

| URL | Purpose |
| --- | --- |
| [http://localhost:4000/docs](http://localhost:4000/docs) | Swagger UI |
| [http://localhost:4000/api/docs](http://localhost:4000/api/docs) | Alias |
| [http://localhost:4000/openapi.json](http://localhost:4000/openapi.json) | Raw OpenAPI 3.0 JSON |
| [http://localhost:4000/api/openapi.json](http://localhost:4000/api/openapi.json) | Alias |

## Auth in Swagger

1. `POST /api/v1/auth/login` with email/password (Try it out).
2. Copy `data.accessToken` from the response.
3. Click **Authorize** → paste the token (Bearer).
4. Call protected endpoints.

Demo users (after `seed:demo`):

- `faculty.demo@learnova.test` / `Demo@12345`
- `student.demo@learnova.test` / `Demo@12345`

## Coverage

Tags: Health · Auth · Institution · Faculty · Students · Courses · Course Builder · Enrollments · Progress.

Spec source: `apps/backend/src/docs/openapi.ts`.
