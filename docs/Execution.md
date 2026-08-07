# Code Execution

## Run code

`POST /api/v1/practice-labs/run`

1. Validate language + lab `allowRun`
2. Create `execution_histories` row (`queued`)
3. Emit Socket.IO `execution.status` on `/practice`
4. Call Judge0 (or mock)
5. Persist stdout/stderr/compile/time/memory
6. Emit domain events `execution.started` / `execution.finished` / `execution.completed`
7. Audit `execution_started` / `execution_finished`

## Real-time

Namespace: `/practice`

Client joins room `user:{userId}` and listens for `execution.status`:

```json
{ "executionId": "...", "status": "running|accepted|...", "queuePosition": 1 }
```

## Queue

BullMQ queue `compile` job `execute-code` (`enqueueLabExecution`) is available for async workers. Sync path is used for interactive Run in v1; worker can take over under load.
