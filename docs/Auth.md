# Authentication & Authorization

Learnova auth is production-ready for institution bootstrap, session lifecycle, and RBAC.

**Access model (canonical):** See [AccessModel.md](./AccessModel.md) — Institution Admin is created via institution registration; Faculty and Student accounts are created only by the Institution Admin; one shared login page; no public faculty/student signup.

## Overview

| Layer | Location |
| --- | --- |
| Models | `apps/backend/src/models/` |
| Repositories | `apps/backend/src/repositories/auth/` |
| Services | `apps/backend/src/services/auth/` |
| Controllers | `apps/backend/src/controllers/auth/` |
| Routes | `apps/backend/src/routes/v1/auth.routes.ts` |
| Middleware | `apps/backend/src/middlewares/auth.middleware.ts` |
| Validation | `packages/validation/src/auth.ts` |
| Seeds | `apps/backend/src/seeds/auth.seed.ts` |
| Frontend | `apps/frontend/src/features/auth/` |

## Collections

- `users`
- `roles`
- `permissions`
- `refresh_tokens`
- `sessions`
- `password_reset_tokens`
- `email_verification_tokens`
- `login_attempts`
- `audit_auth_logs`

## Seed

```bash
pnpm --filter @learnova/backend seed:auth
```

Seeds all permissions from `@learnova/constants` and roles from `@learnova/shared` (`ROLE_DEFINITIONS`).

## API (`/api/v1/auth`)

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/register` | Public (institution bootstrap) |
| POST | `/login` | Public |
| POST | `/logout` | Bearer |
| POST | `/logout-all` | Bearer |
| POST | `/refresh` | Refresh cookie |
| POST | `/forgot-password` | Public |
| POST | `/reset-password` | Public |
| POST | `/change-password` | Bearer |
| POST | `/verify-email` | Public |
| POST | `/resend-verification` | Public |
| GET | `/me` | Bearer |
| GET | `/session` | Bearer |
| GET | `/sessions` | Bearer |
| DELETE | `/sessions/:id` | Bearer |

## Token model

- **Access JWT** — 15 minutes, `Authorization: Bearer`
- **Refresh JWT** — 30 days, HttpOnly cookie `learnova_session` (`Secure`, `SameSite=Lax`)
- Rotation with **token family** + **version**; reuse of an old refresh token revokes the family
- Access payload includes `tv` (token version); logout-all / password change bumps `tokenVersion`

## Login protections

- Auth-specific rate limit (`RATE_LIMIT_AUTH_MAX`, default 20/window)
- Failed attempt counter + exponential lock (`AUTH.MAX_FAILED_ATTEMPTS`, `AUTH.LOCK_BASE_MS`)
- Email verification required before login
- Inactive / locked accounts rejected
- `login_attempts` + `audit_auth_logs` written on success/failure

## Password policy

- Minimum 12 characters
- Uppercase, lowercase, number, special character (`REGEX.PASSWORD_STRONG`)
- Weak password denylist
- Password history (last 5 hashes) — reuse blocked

## Middleware

```ts
authenticate({ required: true })
optionalAuthenticate()
requireRole('institution_admin')
requirePermission('users:manage')
requireOwnership('userId')
```

Authorization decisions use `@learnova/shared` permission matrix (`ROLE_PERMISSIONS`).

## Emails

Provider integration via existing mail factory / queue:

- Verification email
- Password reset email
- Welcome email (on institution register)

Templates are HTML placeholders suitable for console / SMTP / Resend / Brevo / SES.

## Frontend pages

| Route | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/forgot-password` | Request reset |
| `/reset-password` | Complete reset |
| `/verify-email` | Verify email token |
| `/sessions` | Active session management |
| `/unauthorized` | 401 page |
| `/forbidden` | 403 page |

Zustand store + TanStack Query hooks live under `features/auth`. API client sends cookies (`credentials: 'include'`).

## Audit events

`user.login`, `user.login_failed`, `user.logout`, `user.logout_all`, `user.registered`, `password.changed`, `password.reset_requested`, `password.reset_completed`, `email.verification_sent`, `email.verified`, `session.created`, `session.revoked`

## Tests

```bash
pnpm --filter @learnova/backend test
```

Covers password validation, RBAC matrix, session/device parsing, lockout backoff, and refresh rotation rules.

## Environment

| Variable | Notes |
| --- | --- |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥32 chars |
| `JWT_ACCESS_TTL` | default `15m` |
| `JWT_REFRESH_TTL` | default `30d` |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | production cookie flags |
| `RATE_LIMIT_AUTH_MAX` | auth endpoint limiter |
| `BCRYPT_ROUNDS` | default 12 |
| `CORS_ORIGINS` | must include frontend origin (credentials) |

## Register flow (bootstrap)

`POST /register` creates:

1. New `institutionId` (ObjectId — no Institution CRUD module)
2. User with `institution_admin` role
3. Verification + welcome emails

User must verify email before `POST /login` succeeds.
