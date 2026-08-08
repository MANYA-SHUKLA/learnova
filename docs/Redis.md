# Redis

Client: `ioredis` in `backend/src/database/redis`.

## Features

- Connect / disconnect / health (`PING`)
- Reconnect + retry strategy
- Metrics (`getRedisMetrics`)
- TTL helpers (`setWithTtl`, `getTtl`, `expire`)
- Cache service (`backend/src/cache`)
- Distributed lock prep (`acquireLock`)
- Session store prep (`sessionStore`)
- Rate-limit key helper + Redis-backed rate limiter

## Key namespaces (`REDIS_KEYS`)

`session:`, `rl:`, `cache:`, `ide:session:`, `bull:`, `ff:`, `lock:`
