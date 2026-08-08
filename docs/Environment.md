# Environment Variables

All environments are validated with Zod (`@learnova/config`). Apps **fail fast** on missing/invalid values.

Use local env files only (gitignored — never commit secrets):

- `frontend/.env.local`
- `backend/.env`
- `worker/.env`

Generate strong JWT secrets (≥ 32 chars) for anything beyond local toy usage.

Production deploy (Vercel + Render): see [Deploy.md](./Deploy.md).

---

## Frontend (`frontend`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | Runtime mode |
| `NEXT_PUBLIC_APP_URL` | no | `http://localhost:3000` | Public app URL |
| `NEXT_PUBLIC_API_URL` | no | `http://localhost:4000/api/v1` | API base |
| `NEXT_PUBLIC_WS_URL` | no | `http://localhost:4000` | Socket.io origin |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | no | `en` | `en` \| `hi` \| `te` |
| `LOG_LEVEL` | no | `info` | Logging level |

---

## Backend (`backend`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | Runtime mode |
| `PORT` | no | `4000` | HTTP port |
| `HOST` | no | `0.0.0.0` | Bind host |
| `LOG_LEVEL` | no | `info` | Pino level |
| `MONGODB_URI` | **yes** | — | Mongo connection string |
| `MONGODB_DB_NAME` | no | `learnova` | Database name |
| `REDIS_URL` | **yes** | — | Redis connection string |
| `REDIS_PASSWORD` | no | — | Redis auth |
| `JWT_ACCESS_SECRET` | **yes** | — | ≥ 32 chars |
| `JWT_REFRESH_SECRET` | **yes** | — | ≥ 32 chars |
| `JWT_ACCESS_TTL` | no | `15m` | Access token TTL |
| `JWT_REFRESH_TTL` | no | `30d` | Refresh token TTL |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated origins |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` | Rate limit window |
| `RATE_LIMIT_MAX` | no | `100` | Max requests per window |
| `GEMINI_API_KEY` | no | — | Reserved for AI ideation |
| `JUDGE0_API_URL` | no | — | Reserved for coding judge |
| `JUDGE0_API_KEY` | no | — | Judge0 auth |
| `STORAGE_DRIVER` | no | `local` | `local` \| `s3` |
| `STORAGE_LOCAL_PATH` | no | `./uploads` | Local upload root |
| `MAIL_DRIVER` | no | `console` | `console` \| `smtp` \| `ses` |
| `MAIL_FROM` | no | `shuklamanya99@gmail.com` | From address |
| `SMTP_HOST` | no | — | SMTP host when driver=smtp |

### Feature flags (optional)

Read by `@learnova/feature-flags`. Defaults are safe (most capabilities off).

| Variable | Default | Description |
| --- | --- | --- |
| `ENABLE_AI` | `false` | Gemini / ideation surfaces |
| `ENABLE_CHAT` | `false` | Chat features |
| `ENABLE_PROCTORING` | `false` | Exam proctoring |
| `ENABLE_GPU` | `false` | GPU-backed workloads |
| `ENABLE_CODE_RUNNER` | `false` | Judge0 execution |
| `ENABLE_IDE` | `false` | Cloud IDE |
| `ENABLE_ANALYTICS` | `true` | Analytics module |
| `ENABLE_AUDIT_LOGS` | `true` | Audit logging |
| `ENABLE_WEBHOOKS` | `false` | Inbound webhooks |

---

## Worker (`worker`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | Runtime mode |
| `LOG_LEVEL` | no | `info` | Pino level |
| `MONGODB_URI` | **yes** | — | Mongo connection |
| `MONGODB_DB_NAME` | no | `learnova` | DB name |
| `REDIS_URL` | **yes** | — | Redis / BullMQ |
| `WORKER_CONCURRENCY` | no | `5` | Jobs per worker |
| `GEMINI_API_KEY` | no | — | Reserved |
| `JUDGE0_API_URL` | no | — | Reserved |

---

## Staging / Production

Use `apps/*/.env.staging` and `apps/*/.env.production` (gitignored). Inject secrets via your cloud secret manager — never bake them into images.

Validate examples anytime:

```bash
pnpm env:check
```
