# Smoke tests

Smoke tests answer one question: **“Does the platform basically work?”** They are not a full QA suite. Run them after every deploy and before you tell a college the system is live.

---

## The one command you need

From repo root, with **backend + frontend running** (worker optional unless you care about email delivery):

```bash
pnpm verify:platform
```

Exit code `0` = pass. Anything labeled `FAIL` at the end needs attention.

Against staging:

```bash
SMOKE_WEB_URL=https://your-app.vercel.app \
SMOKE_API_URL=https://your-api.onrender.com/api/v1 \
pnpm verify:platform
```

---

## What it checks

The script lives at `backend/src/scripts/verify-platform.ts`. It hits real HTTP endpoints — no mocks.

### Backend health

`/health`, `/ready`, `/live` on the API. If these fail, stop — nothing else will work.

### Authentication

Logs in as admin, faculty, and student using demo credentials. Also probes:

- `GET /auth/me` (includes signed `roleHint` for middleware)
- `GET /auth/sessions`
- `POST /auth/refresh` and `POST /auth/logout`
- Forgot-password endpoint (may skip if rate limited)

**Common failure:** admin password not set. Fix:

```bash
pnpm --filter @learnova/backend exec tsx --env-file=.env src/scripts/set-admin-password.ts
```

**Common failure:** no demo users. Fix:

```bash
pnpm seed:complete
```

**Common failure:** “too many requests” on auth. Wait 60 seconds, re-run.

### Page loads (frontend)

Fetches HTML for role dashboards and key module pages with signed role cookies. Expect HTTP 200.

Includes faculty/student learning paths, certificates, and the shared `/notifications` page.

### RBAC (pages + API)

This is the important part for enterprise trust:

- Faculty cannot open institution or student dashboards
- Students cannot open faculty or institution admin routes
- Faculty API cannot PATCH institution settings or create students
- Student API cannot create faculty
- Faculty course/student lists are scoped smaller than admin lists

If any of these fail, **do not ship**.

### Steps 15–17 (certificates, reports, notifications)

- Student certificate dashboard returns data (when seed ran)
- Admin institution + faculty + student report endpoints respond
- Notification list + unread count work for logged-in users
- `/auth/me` returns a signed `roleHint` (prevents blank screen on refresh)

### Database

Connects to MongoDB and checks expected collections exist (courses, exams, gradebook, certificates, notifications, etc.) and seed counts meet minimums when demo data was loaded.

### Performance (light)

Course list should respond under 3s; pagination must cap at 100 items even if client asks for 9999.

---

## Other scripts (optional)

| Script | When to use |
| --- | --- |
| `pnpm env:check` | Before first run — validates `.env` files exist |
| `pnpm --filter @learnova/backend mail:test` | After configuring SMTP |
| `backend/src/scripts/smoke-provision.ts` | Local E2E: create faculty/student, CSV import, password gate |
| `backend/src/scripts/test-smtp.ts you@email.com` | One-off email send test |

---

## Fixing failures (quick reference)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| All logins FAIL | Wrong password / no seed | `set-admin-password.ts`, `pnpm seed:complete` |
| Page checks FAIL, API OK | Frontend not running or wrong `SMOKE_WEB_URL` | Start `pnpm dev:frontend`, check URL |
| API checks FAIL | Backend down or wrong `SMOKE_API_URL` | Start `pnpm dev:backend` |
| Faculty scoped courses FAIL | Faculty not assigned to courses | Re-run enrollment seed |
| Certificates FAIL (0 count) | Gradebook/cert seed skipped | `pnpm seed:complete` without `SEED_SKIP_CERTIFICATES=1` |
| RBAC FAIL | Real security bug | Fix before deploy — do not ignore |
| Rate limited | Too many login attempts | Wait, re-run |

---

## Manual smoke (5 minutes)

Automation does not click buttons. After `verify:platform` passes, do this once:

1. Login as student → open notifications → mark one read
2. Login as faculty → open gradebook for a course
3. Login as admin → open reports → download CSV
4. Hard-refresh each dashboard three times

If that feels fine, you are in good shape for staging sign-off.

---

## CI

GitHub Actions runs `pnpm build` and tests on push. It does **not** run `verify:platform` (needs live Mongo + running apps). Run smoke manually or in your deploy pipeline after services are up.

See [v1.0-ReleaseChecklist.md](./v1.0-ReleaseChecklist.md) for the full pre-launch list.
