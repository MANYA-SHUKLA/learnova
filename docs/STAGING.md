# Staging deploy & validation checklist

Use after **`pnpm build`** passes locally (Phase A gate).

---

## Phase B — Staging deploy

### 1. MongoDB Atlas

1. Create a free **M0** cluster (or use existing).
2. Database user with read/write on `learnova`.
3. Network access: allow Render/Vercel egress IPs or `0.0.0.0/0` for staging only.
4. Copy connection string → `MONGODB_URI`.

### 2. Redis

**Option A — Upstash:** create DB → copy `REDIS_URL`.  
**Option B — Render Redis:** attach to API service → use internal URL on Render.

### 3. Render (API)

1. Connect GitHub repo.
2. Apply root [`render.yaml`](../render.yaml) **or** manual:
   - Root Directory: `.` (blueprint) or `backend` + `render-build.sh` / `render-start.sh`
3. Set env (see [Deploy.md](./Deploy.md)):

| Variable | Example |
| --- | --- |
| `MONGODB_URI` | Atlas URI |
| `REDIS_URL` | Upstash / Render Redis |
| `JWT_ACCESS_SECRET` | ≥ 32 random chars |
| `JWT_REFRESH_SECRET` | ≥ 32 random chars |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `HOST` | `0.0.0.0` |

4. Deploy → confirm `GET https://<api>/api/v1/live` returns OK.

### 4. Vercel (frontend)

1. Root Directory: **`frontend`**
2. Enable **Include source files outside Root Directory**
3. Env:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://<render-api>/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `https://<render-api>` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` |

**Note:** JWT secrets live on **Render only**. Frontend does not need `JWT_ACCESS_SECRET`.

### 5. Seed staging (once)

From local machine against staging URI (or Render shell):

```bash
# Point backend/.env at staging MONGODB_URI + REDIS_URL temporarily, or:
MONGODB_URI=... REDIS_URL=... pnpm seed:complete
```

Demo logins (after seed): see README — admin / faculty.demo / student.demo.

---

## Phase C — Validation & polish

### Manual E2E (3 roles)

| Role | Login | Smoke paths |
| --- | --- | --- |
| **Institution Admin** | `shuklamanya99@gmail.com` | Dashboard, courses, gradebook, certificates, reports, notifications |
| **Faculty** | `faculty.demo@learnova.test` | Assignments, quizzes, gradebook, reports |
| **Student** | `student.demo@learnova.test` | Courses, grades, certificates, notifications |

**RBAC:** Faculty must **not** open institution-only routes; student must **not** open faculty gradebook write paths → expect `/forbidden` or 403.

### Automated verify (staging)

```bash
SMOKE_WEB_URL=https://your-app.vercel.app \
SMOKE_API_URL=https://<render-api>/api/v1 \
pnpm verify:platform
```

### Demo assets

- [ ] Screenshots: login, 3 dashboards, course detail, gradebook, certificate verify page
- [ ] 5–10 min video: login → enroll → assignment → grade → certificate

---

## Already done (do not redo)

- Steps 1–17 product scope (LMS v1.0)
- RBAC, security docs, scope guards
- Seed at scale (100 faculty, 1000 students, 100 courses)
- `verify:platform` (includes reports, notifications, certificates smoke)
- Deploy docs, [`Deploy.md`](./Deploy.md), CI (`.github/workflows/ci.yml`)
- **`pnpm build`** green (packages + backend + frontend + worker)

Full pre-launch list: [v1.0-ReleaseChecklist.md](./v1.0-ReleaseChecklist.md)

## Explicitly out of scope (v1.0)

Placements, alumni, parent portal, fees, HR, payroll, CRM, AI chatbot, social feed, marketplace, multi-tenant SaaS billing — v1.1+ per [Roadmap.md](./Roadmap.md).
