# Judge0 Integration

Learnova executes learner code through **Judge0 CE** in Docker — never on the API process.

## Quick start (Learnova)

```bash
# 1. Start Judge0 (requires Docker Desktop)
pnpm docker:judge0

# 2. Wait ~60s, then verify
pnpm --filter @learnova/backend judge0:verify

# 3. Seed demo course + labs (if not already done)
pnpm --filter @learnova/backend seed:practice-lab-bootstrap

# 4. Restart backend + worker, then test as student.demo@learnova.test
```

`backend/.env` and `worker/.env` should include:

```env
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
JUDGE0_TIMEOUT_MS=15000
ENABLE_CODE_RUNNER=true
```

Leave `JUDGE0_API_KEY` empty for the local stack (no auth).

## Config

| Env | Purpose |
| --- | --- |
| `JUDGE0_API_URL` | Base URL (e.g. `http://localhost:2358`) |
| `JUDGE0_API_KEY` | Optional auth token |
| `JUDGE0_TIMEOUT_MS` | Poll / request timeout (default 15000) |
| `ENABLE_CODE_RUNNER` | Documented flag (execution uses `JUDGE0_API_URL`) |

Docker stack: [`docker/development/judge0/docker-compose.yml`](../docker/development/judge0/docker-compose.yml)

## Client

Canonical location: `backend/src/services/coding-engine/judge0.client.ts`

- Create / poll / batch submissions (`base64_encoded=true`)
- Maps Judge0 status ids → `ExecutionStatus`
- Language ids from `@learnova/constants` `JUDGE0_LANGUAGE_IDS`

## Offline mock

When `JUDGE0_API_URL` is unset, the client uses a **safe passthrough mock** (no `eval` / `child_process`): stdout ≈ stdin. Useful for UI-only testing; **not** real grading.

## Hosted Judge0 (no local Docker)

Use [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce) or self-host on a VPS:

```env
JUDGE0_API_URL=https://your-judge0-host
JUDGE0_API_KEY=your-token
```

## Security

- CPU / wall time / memory limits per problem (and per test case overrides)
- Isolated Docker containers (Judge0 responsibility)
- No network assumptions for student code inside the sandbox

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `ECONNREFUSED :2358` | Run `pnpm docker:judge0` |
| Judge0 slow first run | Wait for Postgres + workers (~1–2 min) |
| `seed:practice-labs` fails | Run `seed:practice-lab-bootstrap` or `seed:enrollment-stack` first |
| Student sees no labs | Enroll student in course linked to published lab |

Stop Judge0: `pnpm docker:judge0:down`
