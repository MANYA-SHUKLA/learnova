import { REDIS_KEYS, CACHE_TTL } from '@learnova/constants';
import { getRedis } from '../database/redis/connection.js';
import { logger } from '../utils/logger/index.js';

export interface CacheSetOptions {
  /** TTL in seconds. Omit for no expiry. */
  ttlSeconds?: number;
}

/**
 * Redis-backed cache layer.
 * Keys are automatically namespaced under REDIS_KEYS.CACHE.
 */
export class CacheService {
  private prefix(key: string): string {
    return `${REDIS_KEYS.CACHE}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await getRedis().get(this.prefix(key));
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn({ err, key }, 'Cache JSON parse failed — deleting key');
      await this.del(key);
      return null;
    }
  }

  async set(key: string, value: unknown, options: CacheSetOptions = {}): Promise<void> {
    const redis = getRedis();
    const payload = JSON.stringify(value);
    const namespaced = this.prefix(key);
    const ttl = options.ttlSeconds ?? CACHE_TTL.MEDIUM;

    if (ttl > 0) {
      await redis.set(namespaced, payload, 'EX', ttl);
    } else {
      await redis.set(namespaced, payload);
    }
  }

  async del(key: string): Promise<void> {
    await getRedis().del(this.prefix(key));
  }

  async has(key: string): Promise<boolean> {
    const exists = await getRedis().exists(this.prefix(key));
    return exists === 1;
  }

  async delByPrefix(prefix: string): Promise<number> {
    const redis = getRedis();
    const pattern = this.prefix(`${prefix}*`);
    let cursor = '0';
    let removed = 0;

    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        removed += await redis.del(...keys);
      }
    } while (cursor !== '0');

    return removed;
  }

  /**
   * Cache-aside helper: return cached value or compute, store, and return.
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheSetOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, options);
    return value;
  }
}

export const cache = new CacheService();
