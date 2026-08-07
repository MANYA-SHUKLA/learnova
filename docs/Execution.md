# Code Execution

Interactive run and graded evaluation go through the **[Coding Assessment Engine](./CodingEngine.md)** — not ad-hoc Judge0 calls in module services.

## Run code

`POST /api/v1/practice-labs/run`

1. PracticeLabService validates permissions / enrollment / `allowRun`
2. Delegates to `CodingEngine.run()`
3. Engine creates execution history, calls Judge0 (or mock), updates history
4. Emits Socket.IO `execution.status` on `/practice`
5. Lab service emits domain events + audit

## Submit / evaluate

`POST /api/v1/practice-labs/submit` → `CodingEngine.evaluate()` with all test cases (hidden included).

## Real-time

Namespace: `/practice`

Client joins room `user:{userId}` and listens for `execution.status`:

```json
{ "executionId": "...", "status": "running|accepted|...", "queuePosition": 1 }
```

## Queue

BullMQ queue `compile` job `execute-code` (`enqueueLabExecution`) is available for async workers. Sync path is used for interactive Run in v1; worker can take over under load.

## Exams

Coding Exams must call the same engine (`run` / `evaluate`) with an exam storage adapter. Do not fork this flow.
