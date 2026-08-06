import { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger/index.js';

/**
 * Redis connection layer — cache, sessions, rate limits, BullMQ.
 */

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    client.on('connect', () => {
      logger.info('Redis connecting…');
    });

    client.on('ready', () => {
      logger.info('Redis ready');
    });

    client.on('error', (err: Error) => {
      logger.error({ err }, 'Redis error');
    });

    client.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return client;
}

export async function connectRedis(): Promise<Redis> {
  const redis = getRedis();
  if (redis.status === 'wait') {
    await redis.connect();
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis disconnected cleanly');
  }
}

export async function isRedisReady(): Promise<boolean> {
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
