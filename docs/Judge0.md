# Judge0 Integration

Learnova executes learner code through **Judge0 CE** running in Docker — never on the API process.

## Config

| Env | Purpose |
| --- | --- |
| `JUDGE0_API_URL` | Base URL (e.g. `http://localhost:2358`) |
| `JUDGE0_API_KEY` | Optional auth token |
| `JUDGE0_TIMEOUT_MS` | Poll / request timeout (default 15000) |
| `ENABLE_CODE_RUNNER` | Feature flag |

Compose service is commented in `docker/development/docker-compose.yml` until enabled.

## Client

Canonical location: `backend/src/services/coding-engine/judge0.client.ts`

Practice Lab re-exports for compatibility only — new code (including exams) must import from the coding engine.

- Create / poll / batch submissions (`base64_encoded=true`)
- Maps Judge0 status ids → `ExecutionStatus`
- Language ids from `@learnova/constants` `JUDGE0_LANGUAGE_IDS`

## Offline mock

When `JUDGE0_API_URL` is unset, the client uses a **safe passthrough mock** (no `eval` / `child_process`): stdout ≈ stdin. Useful for local CRUD/UI testing; enable real Judge0 for accurate grading.

## Security

- CPU / wall time / memory limits per problem (and per test case overrides)
- Isolated Docker containers (Judge0 responsibility)
- No network assumptions for student code inside the sandbox
