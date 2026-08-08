# Deploy — Vercel (frontend) + Render (backend)

Learnova is a **pnpm monorepo**. Workspace packages live under `packages/`, so installs must always resolve from the **repository root** even when the platform “Root Directory” is an app folder.

```
learnova/                 ← lockfile + pnpm-workspace.yaml (install here)
├── frontend/        ← Vercel Root Directory
├── backend/         ← Render Root Directory (manual) or use root render.yaml
└── packages/*
```

Node **22** (see `.nvmrc`). Package manager **pnpm@10.32.1** (`packageManager` in root `package.json`).

---

## Frontend → Vercel

### Import settings

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root Directory | `frontend` |
| Install Command | *(from `vercel.json`)* `cd ../.. && corepack enable && pnpm install --frozen-lockfile` |
| Build Command | *(from `vercel.json`)* `cd ../.. && pnpm exec turbo run build --filter=@learnova/frontend` |
| Output | `.next` (default) |

Config file: [`frontend/vercel.json`](../frontend/vercel.json)

In Project Settings → General, enable **Include source files outside of the Root Directory in the Build Step** if Vercel prompts for it (needed so `packages/` are visible).

### Environment variables

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://learnova-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `https://learnova-api.onrender.com` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` |

---

## Backend → Render

### Option A — Blueprint (recommended)

Connect the repo and use root [`render.yaml`](../render.yaml). Service build/start run from the monorepo root automatically.

### Option B — Root Directory = `backend`

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `bash scripts/render-build.sh` |
| Start Command | `bash scripts/render-start.sh` |
| Health Check Path | `/api/v1/live` |

Those scripts `cd` to the monorepo root, then `pnpm install` + turbo build / start. See [`backend/render.yaml`](../backend/render.yaml) notes.

### Environment variables (required)

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `MONGODB_URI` | Atlas (or other) connection string |
| `REDIS_URL` | Redis / Upstash / Render Redis |
| `JWT_ACCESS_SECRET` | ≥ 32 chars |
| `JWT_REFRESH_SECRET` | ≥ 32 chars |
| `CORS_ORIGINS` | Your Vercel origin(s), comma-separated e.g. `https://your-app.vercel.app` |
| `COOKIE_SECURE` | `true` |

`PORT` is injected by Render — do not hardcode it. The API already reads `process.env.PORT`.

Optional: `MAIL_*`, `JUDGE0_*`, `STORAGE_*` — see [Environment.md](./Environment.md).

---

## Why not “only the app folder”?

`@learnova/backend` / `@learnova/frontend` depend on `workspace:*` packages. A bare `pnpm install` inside `backend` alone cannot resolve them. The deploy configs always install from the repo root while keeping each platform’s Root Directory pointed at the app you care about.

---

## Local parity check

```bash
# Frontend production build (same filter as Vercel)
pnpm exec turbo run build --filter=@learnova/frontend

# Backend production build + start (same as Render)
pnpm exec turbo run build --filter=@learnova/backend
pnpm --filter @learnova/backend start:prod
```

---

## Post-deploy checklist

1. Set `CORS_ORIGINS` on Render to the Vercel URL
2. Set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` on Vercel to the Render URL
3. Re-seed auth on production if needed: `pnpm --filter @learnova/backend seed:auth` (one-off via Render shell / local against prod URI)
4. Confirm `GET https://<api>/api/v1/live` returns OK
