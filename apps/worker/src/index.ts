import { startWorkers } from './processors/index.js';
import { closeRedisConnection } from './connection/redis.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  const workers = await startWorkers();
  logger.info('Learnova worker framework ready');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Worker shutting down…');
    await Promise.all(workers.map((w) => w.close()));
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
