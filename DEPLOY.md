# Deploy (quick reference)

| Platform | Root Directory | Config |
| --- | --- | --- |
| **Vercel** (frontend) | `frontend` | [`frontend/vercel.json`](./frontend/vercel.json) |
| **Render** (API) | `.` (repo root) or `backend` | [`render.yaml`](./render.yaml) or [`backend/render.yaml`](./backend/render.yaml) |

Full checklist: [docs/Deploy.md](./docs/Deploy.md)

## Vercel

1. Import repo → set **Root Directory** = `frontend`
2. Enable **Include source files outside of the Root Directory** (so `packages/` resolve)
3. Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_APP_URL`

Install/build run from repo root automatically via `vercel.json` (`cd .. && pnpm install …`).

## Render

**Option A (recommended):** Connect repo and apply root [`render.yaml`](./render.yaml) — builds from monorepo root.

**Option B:** Root Directory = `backend`, Build = `bash scripts/render-build.sh`, Start = `bash scripts/render-start.sh`.

## Why `packages/` stays at the root

Frontend and backend import `@learnova/ui`, `@learnova/types`, etc. via `workspace:*`. Both platforms must install from the **repository root** (lockfile + `pnpm-workspace.yaml`), even when Root Directory points at `frontend` or `backend`.

## Layout

```
learnova/
├── frontend/     ← Vercel
├── backend/      ← Render
├── worker/       ← optional (commented in render.yaml)
├── packages/     ← shared code (required for build)
├── render.yaml
└── pnpm-workspace.yaml
```
