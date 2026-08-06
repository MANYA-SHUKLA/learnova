# Logger

Package: `@learnova/logger` (Pino).

## Features

- Structured JSON in production
- Pretty transport in development
- Levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
- `audit(message, data)` — always structured with `audit: true`
- `domain(domain, level, message, data)` — request/response/error/database/redis/socket/bullmq/system
- Redaction of secrets (JWT, passwords, API keys)
- Log rotation **preparation** (`LOG_DIR`, `LOG_MAX_FILES`, `LOG_MAX_SIZE`)
- `installProcessErrorHandlers` — uncaughtException + unhandledRejection

## Usage

```ts
import { logger } from './utils/logger';

logger.info({ requestId }, 'hello');
logger.domain('database', 'info', 'MongoDB connected');
logger.audit('Permission changed', { actorId });
```

## Request / response logs

`pino-http` middleware (`httpLogger`) logs HTTP request/response cycles with request IDs.
