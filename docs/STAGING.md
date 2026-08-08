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
| **Institution Admin** | `shuklamanya99@gmail.com` | Dashboard, courses, faculty, students, gradebook overview |
| **Faculty** | `faculty.demo@learnova.test` | Assignments, quizzes, grade entry |
| **Student** | `student.demo@learnova.test` | Enrolled courses, submit assignment, view grades |

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

- Steps 1–15 product scope
- RBAC, security docs, scope guards
- Seed at scale (100 faculty, 1000 students, 100 courses)
- `verify:platform` passing locally
- Deploy docs, [`DEPLOY.md`](../DEPLOY.md), CI (`.github/workflows/ci.yml`)
- **`pnpm build`** green (packages + backend + frontend + worker)

## Explicitly out of scope

Steps **16** (Analytics), **17** (AI generation), **Placements** — deferred per [Roadmap.md](./Roadmap.md).
