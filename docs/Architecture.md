# Architecture

## Overview

Learnova is a modular enterprise SaaS platform delivered as a **pnpm + Turborepo monorepo**. Apps are independently deployable; shared contracts and UI live in packages to prevent duplication and drift.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│   MongoDB   │
│  Next.js 15 │     │  Express 5  │     └─────────────┘
└──────┬──────┘     └──────┬──────┘
       │ Socket.io         │ BullMQ
       │                   ▼
       │            ┌─────────────┐     ┌─────────────┐
       └───────────▶│    Redis    │◀────│   Worker    │
                    └─────────────┘     └─────────────┘
```

## Principles

1. **Clean Architecture** — Controllers → Services → Repositories → Database. No business logic in routes.
2. **SOLID** — Single responsibility per module; depend on interfaces (`IRepository`), not concrete models.
3. **DTO + Validation** — Zod at the boundary; typed DTOs between layers.
4. **Centralized cross-cutting** — Response wrapper, error hierarchy, logger, request ID, rate limit.
5. **Feature-driven frontend** — Domain features own their UI, hooks, services, and stores.
6. **Contract-first packages** — `@learnova/types`, `@learnova/constants`, `@learnova/shared`, `@learnova/events`, and `@learnova/validation` are the source of truth for roles, permissions, events, and API shapes.

## Frontend

- **App Router** with `[locale]` for i18n (en, hi, te — extensible).
- Route groups: `(public)`, `(auth)`, `(dashboard)`.
- Providers: Theme → Query → Auth → Role.
- Auth is **prepared**: AuthProvider, RoleProvider, JWT helpers, ProtectedRoute, middleware gates — login not implemented.
- Design tokens in `@learnova/ui` (light/dark via `next-themes` class strategy).

## Backend

- Versioned API under `/api/v1`, plus `/api/internal` and `/api/webhooks` mounts for future ops and provider callbacks.
- Middleware chain: Helmet → CORS → compression → JSON → cookies → request ID → HTTP logger → rate limit → routes → 404 → error handler.
- Database layers ready (Mongo + Redis). **No models.**
- **Cache** — Redis-backed `CacheService` (`get` / `set` / `del` / `wrap`).
- **Queues** — BullMQ producers on API (`enqueueEmail`, `enqueueAudit`, …); workers consume typed jobs.
- **Events** — in-process `eventBus` with infrastructure listeners → audit queue.
- **Storage** — `IStorage` with `local` driver (S3 port reserved).
- **Mail** — `IMailer` with `console` / `smtp` / `ses` (SES reserved).
- Auth middleware prepared (`authenticate`, `requireRoles`, `requirePermissions`) — soft by default.
- Socket.io namespaces prepared: `/ide`, `/exam`, `/notifications`.
- Health checks include mongo, redis, storage, mail, and queue depths.

## Worker

BullMQ workers for `email`, `notifications`, `grading`, `analytics`, `audit`. Email processor sends via console/SMTP; others log job receipt until feature work lands. Shared job payload types live in `@learnova/types`.

## Security posture (foundation)

- JWT access/refresh secret validation via Zod env schema.
- Helmet, CORS allowlist, rate limiting (Redis-backed).
- Security response headers on Next.js.
- Logger redacts auth headers and token fields.
- No secrets committed (`.env.example` only).

## Scalability

| Concern | Approach |
| --- | --- |
| Horizontal API scale | Stateless Express + JWT; sticky sessions only for Socket.io (or Redis adapter later) |
| Background work | BullMQ on Redis — scale worker replicas independently |
| Cache | Redis key namespace (`REDIS_KEYS`) ready |
| Frontend | Next.js standalone output; CDN for static; Turborepo remote cache ready |
| Multi-tenant | `institutionId` on JWT payload and domain stubs |
| i18n | Locale prefix + message catalogs; add locale by file + routing entry |
| Modules | Feature folders + route mounts stay isolated until wired |

## Environments

| Env | Purpose |
| --- | --- |
| development | Local apps + Docker Mongo/Redis |
| staging | Pre-prod images, staging compose |
| production | Multi-stage Dockerfiles; prefer K8s/ECS/Cloud Run |

## What is intentionally not built

- Login / register / password flows
- CRUD endpoints and Mongoose models
- Business services for LMS/ERP/Exam/etc.
- Judge0 / Gemini integration (env keys reserved)

This keeps the foundation honest: teams can start feature work without fighting incomplete demos.
