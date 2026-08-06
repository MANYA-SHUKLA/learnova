# Monitoring

`apps/backend/src/monitoring`

## Collector

`collectMetrics()` / `getMonitoringSnapshot()`:

- Memory (RSS, heap, system)
- CPU load average + estimate
- Mongo metrics
- Redis metrics
- Avg response time (from `metricsMiddleware`)

## Worker

Worker health HTTP on `WORKER_HEALTH_PORT` (default `4100`): `/health`, `/live`.

## API surfaces

Health payload includes memory, cpu, database, redis, queue depths, version, commit.
