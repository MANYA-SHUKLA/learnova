# Infrastructure

Learnova backend infrastructure (Step 2+) — no business domains.

## Scope

| Layer | Location |
| --- | --- |
| Config | `packages/config` + `apps/backend/src/config` |
| Logger | `packages/logger` |
| Mongo / Redis | `apps/backend/src/database` |
| Cache | `apps/backend/src/cache` |
| Queues | `apps/backend/src/queues` |
| Storage | `apps/backend/src/storage` |
| Mail | `apps/backend/src/mail` |
| Events | `apps/backend/src/events` + `packages/events` |
| Errors | `apps/backend/src/utils/errors` |
| Health | `/api/v1/health`, `/live`, `/ready`, `/version` |
| Monitoring | `apps/backend/src/monitoring` |
| Security prep | `apps/backend/src/security` |
| Worker | `apps/worker` |

## Startup sequence

1. Parse & validate env (`@learnova/config`)
2. `connectMongo()` — retry/backoff
3. `connectRedis()` — retry strategy
4. `initQueues()` — BullMQ + DLQ + QueueEvents
5. `getStorage()` / `getMailer()`
6. `registerInfrastructureListeners()`
7. `createApp()` + Socket.io
8. Listen on `HOST:PORT`

## Shutdown sequence

1. SIGTERM / SIGINT
2. `httpServer.close()`
3. `closeQueues()`
4. `disconnectMongo()` + `disconnectRedis()`
5. `process.exit(0)`

## Explicitly out of scope

Auth, users, courses, CRUD, Mongoose models, collections, business logic.
