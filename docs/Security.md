# Security

Learnova enforces authorization at the **API layer** first. UI route guards and signed cookies are defense-in-depth only.

## Layers

| Layer | Mechanism |
| --- | --- |
| API | JWT + session validation, permission matrix, service scoping |
| Express middleware | `authenticate`, `requirePermission`, `tenantGuard`, scope guards |
| Next.js middleware | Session cookie + HMAC-signed `learnova_role` hint |
| Client layouts | Role prefix guards (`/faculty`, `/student`, `/institution`) |

## Headers

Helmet CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and HSTS in production (`security-headers.middleware.ts`).

## Cookies

Refresh token: HttpOnly, SameSite=Lax, secure in production. Role hint: signed with `JWT_ACCESS_SECRET` / `ROLE_HINT_SECRET` (frontend middleware must share the secret).

## Rate limiting

Global API limiter + stricter auth limiter on login, refresh, forgot-password. Redis-backed with in-memory fallback.

## Audit

Permission, role, and ownership denials are logged and persisted as `access.denied` in `audit_auth_logs`.

## CSRF

Prepared via `CSRF_ENABLED` — enable when mutating cookie-auth flows expand beyond Bearer JWT.

See also: [RBAC.md](./RBAC.md), [Permissions.md](./Permissions.md), [Ownership.md](./Ownership.md), [MultiTenancy.md](./MultiTenancy.md).
