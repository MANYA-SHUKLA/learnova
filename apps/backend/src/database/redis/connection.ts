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

function isClientDead(redis: Redis): boolean {
  return redis.status === 'end';
}

function createRedisClient(): Redis {
  const redis = new Redis(redisConfig.url, {
    password: redisConfig.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: redisConfig.connectTimeout,
    keepAlive: redisConfig.keepAlive,
    retryStrategy(times) {
      // Cap delay but keep retrying — Upstash idle timeouts are expected.
      // Returning null permanently kills the client and breaks rate-limits.
      if (times > redisConfig.maxRetries) {
        logger.domain('redis', 'error', 'Redis max retries exceeded; backing off', {
          times,
        });
        return Math.min(times * 500, 15_000);
      }
      const delay = Math.min(times * 200, 2000);
      logger.domain('redis', 'warn', 'Redis reconnecting', { times, delay });
      return delay;
    },
  });

  redis.on('connect', () => {
    logger.domain('redis', 'info', 'Redis connecting…');
  });

  redis.on('ready', () => {
    lastReadyAt = new Date().toISOString();
    lastError = null;
    logger.domain('redis', 'info', 'Redis ready');
  });

  redis.on('error', (err: Error) => {
    lastError = err.message;
    logger.domain('redis', 'error', 'Redis error', { err });
  });

  redis.on('close', () => {
    logger.domain('redis', 'warn', 'Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.domain('redis', 'info', 'Redis reconnecting…');
  });

  return redis;
}

export function getRedis(): Redis {
  if (client && isClientDead(client)) {
    client.removeAllListeners();
    try {
      client.disconnect();
    } catch {
      // ignore — already ended
    }
    client = null;
  }

  client ??= createRedisClient();
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
