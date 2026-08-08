# Learnova

Enterprise learning platform for colleges and universities — LMS, academic structure, assessments, gradebook, certificates, reports, and notifications.

---

## Status — v1.0

| Step | Scope | State |
| --- | --- | --- |
| 1–14 | ERP core + LMS + gradebook | ✅ Complete |
| 15 | Certificates | ✅ Complete |
| 16 | Reports & analytics | ✅ Complete |
| 17 | Notifications (in-app + email) | ✅ Complete |

**You deploy yourself.** Before go-live, run through [docs/v1.0-ReleaseChecklist.md](./docs/v1.0-ReleaseChecklist.md) and `pnpm verify:platform`.

**Not in v1.0:** Placements, alumni, fees, HR, CRM, AI chatbot, social/messaging products — see [docs/Roadmap.md](./docs/Roadmap.md) for v1.1+.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, TanStack Query, Zustand, next-intl |
| Backend | Node.js, Express 5, MongoDB, Redis, Socket.io, BullMQ, JWT |
| Worker | BullMQ (email, notifications, grading, cleanup) |
| Tooling | pnpm workspaces, Turborepo, Docker |

---

## Quick start (local)

```bash
pnpm install
pnpm env:check
pnpm docker:dev          # Mongo + Redis
pnpm dev                 # frontend + backend + worker (or split terminals)
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Health | http://localhost:4000/api/v1/health |

Env files (gitignored): `frontend/.env.local`, `backend/.env`, `worker/.env` — see [docs/Environment.md](./docs/Environment.md).

Demo data (optional):

```bash
pnpm seed:complete
pnpm verify:platform
```

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps |
| `pnpm build` | Full monorepo build |
| `pnpm verify:platform` | Smoke test API + pages + RBAC |
| `pnpm env:check` | Validate local env files |
| `pnpm seed:complete` | Demo institution at scale |
| `pnpm docker:dev` | Local Mongo + Redis |

---

## Documentation

**Launch**

- [v1.0 Release checklist](./docs/v1.0-ReleaseChecklist.md)
- [Smoke tests](./docs/SmokeTests.md)
- [Deploy (Vercel + Render)](./docs/Deploy.md)
- [Environment variables](./docs/Environment.md)
- [Staging validation](./docs/STAGING.md)

**Product**

- [Architecture](./docs/Architecture.md) · [Auth](./docs/Auth.md) · [RBAC](./docs/RBAC.md)
- [Gradebook](./docs/Gradebook.md) · [Certificates](./docs/Certificates.md) · [Reports](./docs/Reports.md)
- [Roadmap](./docs/Roadmap.md)

---

## Roles (v1.0)

- **Institution admin** — full academic operations
- **Faculty** — teaching, grading, course tools
- **Student** — learning, submissions, grades, certificates

Reserved for future versions: Super Admin, Teaching Assistant, Placement Officer, Parent.

---

MANYA SHUKLA · 2026
