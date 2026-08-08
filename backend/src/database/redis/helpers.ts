import { REDIS_KEYS } from '@learnova/constants';
import { createId } from '@learnova/utils';
import { getRedis } from './connection.js';
import { logger } from '../../utils/logger/index.js';

/** TTL helpers */
export async function setWithTtl(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  await getRedis().set(key, value, 'EX', ttlSeconds);
}

export async function getTtl(key: string): Promise<number> {
  return getRedis().ttl(key);
}

export async function expire(key: string, ttlSeconds: number): Promise<boolean> {
  const result = await getRedis().expire(key, ttlSeconds);
  return result === 1;
}

/**
 * Distributed lock preparation (SET NX EX).
 * Returns unlock function or null if lock not acquired.
 */
export async function acquireLock(
  resource: string,
  ttlSeconds = 30,
): Promise<{ token: string; unlock: () => Promise<void> } | null> {
  const token = createId();
  const key = `${REDIS_KEYS.LOCK}${resource}`;
  const result = await getRedis().set(key, token, 'EX', ttlSeconds, 'NX');
  if (result !== 'OK') return null;

  return {
    token,
    unlock: async () => {
      const current = await getRedis().get(key);
      if (current === token) {
        await getRedis().del(key);
        logger.domain('redis', 'debug', 'Lock released', { resource });
      }
    },
  };
}

/** Session storage preparation — no auth flows */
export const sessionStore = {
  async set(sessionId: string, payload: unknown, ttlSeconds: number): Promise<void> {
    const key = `${REDIS_KEYS.SESSION}${sessionId}`;
    await getRedis().set(key, JSON.stringify(payload), 'EX', ttlSeconds);
  },
  async get<T>(sessionId: string): Promise<T | null> {
    const raw = await getRedis().get(`${REDIS_KEYS.SESSION}${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  },
  async del(sessionId: string): Promise<void> {
    await getRedis().del(`${REDIS_KEYS.SESSION}${sessionId}`);
  },
  async touch(sessionId: string, ttlSeconds: number): Promise<boolean> {
    return expire(`${REDIS_KEYS.SESSION}${sessionId}`, ttlSeconds);
  },
};

/** Rate-limit storage key helper */
export function rateLimitKey(identifier: string): string {
  return `${REDIS_KEYS.RATE_LIMIT}${identifier}`;
}
