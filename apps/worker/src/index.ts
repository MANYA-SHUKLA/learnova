import { startWorkers, getWorkerMetrics } from './processors/index.js';
import { closeRedisConnection } from './connection/redis.js';
import { startWorkerHealthServer } from './health/server.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  const workers = await startWorkers();
  const healthServer = startWorkerHealthServer(workers);
  logger.info({ metrics: getWorkerMetrics(workers) }, 'Learnova worker framework ready');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Worker shutting down…');
    await Promise.all(workers.map((w) => w.close()));
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));
    await closeRedisConnection();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start worker');
  process.exit(1);
});
