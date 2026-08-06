# Learnova

Enterprise AI Learning Platform.

LMS · University ERP · Online Examination · Coding Platform · Cloud IDE · AI Project Ideation · Analytics · Audit Logs

---

## Status

**Foundation phase — Step 2 complete.** Stable backend infrastructure is in place: Mongo/Redis, queues, cache, events, storage & mail abstractions, logging, config, errors, and health. Authentication, CRUD, domain models, and business APIs are intentionally not implemented yet.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shadcn/Radix, TanStack Query, Zustand, next-intl |
| Backend | Node.js, Express 5, TypeScript, MongoDB/Mongoose, Redis, Socket.io, BullMQ, JWT |
| Worker | BullMQ processors (email, notifications, grading, analytics, audit) |
| Tooling | pnpm workspaces, Turborepo, ESLint 9, Prettier, Husky, Commitlint, Docker |

## Monorepo layout

```
apps/
  frontend/     Next.js App Router (feature-driven)
  backend/      Express API (/api/v1, /api/internal, /api/webhooks)
  worker/       Background job processors
packages/
  ui/             Design system + shared components
  types/          Shared TypeScript contracts
  shared/         Roles, permissions, error code helpers
  constants/      Roles, routes, status, regex, error codes
  events/         Domain event name catalog
  validation/     Shared Zod schemas
  logger/         Structured logger (info/warn/error/debug/audit)
  feature-flags/  ENABLE_AI, ENABLE_CHAT, …
  utils/          Date, pagination, UUID, file, encryption helpers
  config/         Env + app/database/redis/jwt/socket/…
  eslint-config/
  tsconfig/
docker/
docs/
  adr/          Architecture Decision Records
scripts/
.github/
```

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 10
- Docker (for local MongoDB + Redis)

## Quick start

```bash
# 1. Install
pnpm install

# 2. Copy environment files
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
cp apps/worker/.env.example apps/worker/.env

# 3. Start infrastructure
pnpm docker:dev

# 4. Build shared packages
pnpm --filter @learnova/types build
pnpm --filter @learnova/constants build
pnpm --filter @learnova/validation build
pnpm --filter @learnova/utils build
pnpm --filter @learnova/shared build
pnpm --filter @learnova/config build
pnpm --filter @learnova/logger build
pnpm --filter @learnova/events build
pnpm --filter @learnova/feature-flags build

# 5. Run apps
pnpm dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/api/v1/health |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps in parallel |
| `pnpm build` | Build entire monorepo |
| `pnpm lint` | ESLint across packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm format` | Prettier write |
| `pnpm docker:dev` | Local Mongo + Redis |
| `pnpm env:check` | Validate .env.example files |

## Documentation

- [Architecture](docs/Architecture.md)
- [ADRs](docs/adr/README.md)
- [Folder Structure](docs/FolderStructure.md)
- [Coding Standards](docs/CodingStandards.md)
- [Contribution Guide](docs/Contribution.md)
- [Environment Variables](docs/Environment.md)

## Roles (v1)

- Student
- Faculty
- Institution Admin

Reserved for future: Super Admin, Teaching Assistant, Placement Officer, Parent.

MANYA SHUKLA 2026
