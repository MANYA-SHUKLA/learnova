import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let client: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    client.on('error', (err: Error) => {
      logger.error({ err }, 'Worker Redis error');
    });
  }
  return client;
}

export async function closeRedisConnection(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Worker Redis disconnected');
  }
}
