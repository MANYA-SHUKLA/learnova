# Queue

BullMQ on Redis. Producers in API; consumers in worker.

## Queues

| Queue | Purpose |
| --- | --- |
| `email` | Outbound mail |
| `notifications` | Push / in-app notifications |
| `certificate` | Certificate generation |
| `ai` | AI jobs |
| `compile` | Code compile / Judge0 handoff |
| `analytics` | Metrics aggregation |
| `audit` | Audit trail persistence |
| `cleanup` | TTL / GC tasks |
| `grading` | Exam/lab grading (kept) |

## Per-queue capabilities

- Worker registration (`apps/worker`)
- `QueueEvents` (completed / failed)
- Retry + exponential backoff (config: `BULLMQ_*`)
- Priority on enqueue (`EnqueueOptions.priority`)
- Dead-letter queues: `{name}{BULLMQ_DLQ_SUFFIX}` (default `:dlq`)

## Producers

```ts
import { enqueueEmail, enqueueAudit } from './queues';

await enqueueEmail({ to, subject, text });
```

## Rule

No business job implementations yet — processors are scaffolds (email uses mail abstraction).
