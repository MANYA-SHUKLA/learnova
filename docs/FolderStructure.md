# Folder Structure

## Why every top-level folder exists

| Path | Purpose |
| --- | --- |
| `apps/` | Deployable applications (frontend, API, worker) |
| `packages/` | Shared libraries consumed by apps — types, UI, config, lint, tsconfig |
| `docker/` | Compose files + Dockerfiles per environment |
| `docs/` | Engineering documentation |
| `scripts/` | Repo maintenance (env checks, codegen hooks) |
| `.github/` | CI workflows |
| `.husky/` | Git hooks (pre-commit, commit-msg) |

---

## `apps/frontend/src`

| Folder | Why it exists |
| --- | --- |
| `app/` | Next.js App Router — routes, layouts, locale segment |
| `components/` | Shared presentational UI (not feature-specific) |
| `components/ui/` | App-local shadcn primitives (extends `@learnova/ui`) |
| `components/layout/` | Shell: sidebar, header, footers |
| `components/shared/` | Cross-feature widgets (e.g. ProtectedRoute) |
| `components/feedback/` | Toasts, empty states, error boundaries |
| `features/` | Feature-driven modules (lms, erp, exam, …) |
| `features/*/components` | Feature-owned UI |
| `features/*/hooks` | Feature-owned React hooks |
| `features/*/services` | Feature API calls |
| `features/*/stores` | Feature Zustand slices |
| `features/*/types` | Feature-local types |
| `features/*/utils` | Feature-local helpers |
| `hooks/` | App-wide hooks |
| `services/` | Cross-cutting API services |
| `stores/` | Global client stores |
| `lib/` | Low-level libs (auth, api client, i18n, theme) |
| `providers/` | React context providers |
| `styles/` | Global CSS entry |
| `types/` | Frontend-only ambient/types |
| `constants/` | Route maps, static config |
| `config/` | Env + app config |
| `utils/` | Pure helpers |
| `assets/` | Static assets imported by code |

`messages/` holds next-intl catalogs (`en`, `hi`, `te`).

---

## `apps/backend/src`

| Folder | Why it exists |
| --- | --- |
| `config/` | App + validated environment |
| `controllers/` | HTTP adapters (thin) |
| `routes/` | Express routers; `v1/`, `internal/`, `webhooks/` |
| `middlewares/` | Auth, validate, rate limit, logging, errors, request ID |
| `services/` | Business logic (empty until features) |
| `repositories/` | Data access; `base/` holds abstract repository |
| `models/` | Mongoose schemas — **reserved, no models yet** |
| `validators/` | Zod request schemas |
| `dtos/` | Transport shapes |
| `interfaces/` | Ports for DI (repositories, services) |
| `jobs/` | Job payloads / schedulers |
| `queues/` | Queue definitions for BullMQ |
| `events/` | Domain event emitters/listeners |
| `socket/` | Socket.io setup + handlers |
| `utils/` | Logger, errors, response, JWT |
| `helpers/` | Small pure helpers |
| `constants/` | Backend constants |
| `types/` | Express augmentations / local types |
| `database/` | Mongo + Redis connection layers |

---

## `apps/worker/src`

| Folder | Why |
| --- | --- |
| `config/` | Worker env |
| `queues/` | Queue name constants |
| `processors/` | BullMQ processors per domain |
| `jobs/` | Job type definitions |
| `utils/` | Logger / helpers |
| `types/` | Worker-local types |

---

## `packages/`

| Package | Why |
| --- | --- |
| `ui` | Design tokens, primitives, Tailwind theme — single visual language |
| `types` | Shared API/auth/domain TypeScript contracts |
| `shared` | Role/permission matrix, error helpers; re-exports common constants |
| `constants` | Magic-string killers: roles, permissions, routes, status, errors, regex |
| `events` | Domain event names (`course.created`, `exam.started`, …) |
| `validation` | Shared Zod schemas |
| `logger` | `createLogger` — info / warn / error / debug / audit |
| `feature-flags` | `ENABLE_AI`, `ENABLE_CHAT`, `ENABLE_PROCTORING`, … |
| `utils` | Date, time, pagination, search, UUID, file, encryption helpers |
| `config` | Zod env schemas: app, database, redis, jwt, socket, storage, mail, gemini, judge0, docker |
| `eslint-config` | One lint policy for all packages |
| `tsconfig` | Shared TS bases (base, next, node, react-library) |

## `docs/adr/`

Architecture Decision Records — why MongoDB, Redis, Turborepo, Express, Socket.io, Gemini, Judge0, etc.

## Backend API mounts

| Path | Purpose |
| --- | --- |
| `/api/v1/*` | Public versioned product API |
| `/api/internal/*` | Service-to-service / ops (auth later) |
| `/api/webhooks/*` | Inbound provider webhooks |
