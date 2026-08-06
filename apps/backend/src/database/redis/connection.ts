import { Redis } from 'ioredis';
import { redisConfig } from '../../config/slices.js';
import { logger } from '../../utils/logger/index.js';
import { RedisError } from '../../utils/errors/index.js';

/**
 * Redis connection layer — cache, sessions, rate limits, BullMQ, locks.
 */

let client: Redis | null = null;
let lastReadyAt: string | null = null;
let lastError: string | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(redisConfig.url, {
      password: redisConfig.password,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: redisConfig.connectTimeout,
      keepAlive: redisConfig.keepAlive,
      retryStrategy(times) {
        if (times > redisConfig.maxRetries) {
          logger.domain('redis', 'error', 'Redis max retries exceeded', { times });
          return null;
        }
        const delay = Math.min(times * 200, 2000);
        logger.domain('redis', 'warn', 'Redis reconnecting', { times, delay });
        return delay;
      },
    });

    client.on('connect', () => {
      logger.domain('redis', 'info', 'Redis connecting…');
    });

    client.on('ready', () => {
      lastReadyAt = new Date().toISOString();
      lastError = null;
      logger.domain('redis', 'info', 'Redis ready');
    });

    client.on('error', (err: Error) => {
      lastError = err.message;
      logger.domain('redis', 'error', 'Redis error', { err });
    });

    client.on('close', () => {
      logger.domain('redis', 'warn', 'Redis connection closed');
    });

    client.on('reconnecting', () => {
      logger.domain('redis', 'info', 'Redis reconnecting…');
    });
  }

  return client;
}

export async function connectRedis(): Promise<Redis> {
  const redis = getRedis();
  if (redis.status === 'wait') {
    try {
      await redis.connect();
    } catch (err) {
      throw new RedisError('Failed to connect to Redis', {
        cause: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.domain('redis', 'info', 'Redis disconnected cleanly');
  }
}

export async function isRedisReady(): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export function getRedisMetrics(): {
  status: string;
  lastReadyAt: string | null;
  lastError: string | null;
} {
  return {
    status: client?.status ?? 'uninitialized',
    lastReadyAt,
    lastError,
  };
}
