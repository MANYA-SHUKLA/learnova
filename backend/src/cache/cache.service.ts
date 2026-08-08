import { REDIS_KEYS, CACHE_TTL } from '@learnova/constants';
import { getRedis } from '../database/redis/connection.js';
import { logger } from '../utils/logger/index.js';

export interface CacheSetOptions {
  /** TTL in seconds. 0 = no expiry. Default MEDIUM. */
  ttlSeconds?: number;
  /** Optional namespace override (appended under REDIS_KEYS.CACHE) */
  namespace?: string;
  /** Compression preparation flag — reserved for future gzip */
  compress?: boolean;
}

/**
 * Redis-backed cache layer with namespace + JSON serialization.
 */
export class CacheService {
  constructor(private readonly defaultNamespace = 'app') {}

  private prefix(key: string, namespace?: string): string {
    const ns = namespace ?? this.defaultNamespace;
    return `${REDIS_KEYS.CACHE}${ns}:${key}`;
  }

  async get<T>(key: string, namespace?: string): Promise<T | null> {
    const raw = await getRedis().get(this.prefix(key, namespace));
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn({ err, key }, 'Cache JSON parse failed — deleting key');
      await this.del(key, namespace);
      return null;
    }
  }

  async set(key: string, value: unknown, options: CacheSetOptions = {}): Promise<void> {
    const redis = getRedis();
    const payload = JSON.stringify(value);
    // compress flag reserved — store marker in future
    void options.compress;
    const namespaced = this.prefix(key, options.namespace);
    const ttl = options.ttlSeconds ?? CACHE_TTL.MEDIUM;

    if (ttl > 0) {
      await redis.set(namespaced, payload, 'EX', ttl);
    } else {
      await redis.set(namespaced, payload);
    }
  }

  async del(key: string, namespace?: string): Promise<void> {
    await getRedis().del(this.prefix(key, namespace));
  }

  /** Alias for del */
  async invalidate(key: string, namespace?: string): Promise<void> {
    await this.del(key, namespace);
  }

  async has(key: string, namespace?: string): Promise<boolean> {
    const exists = await getRedis().exists(this.prefix(key, namespace));
    return exists === 1;
  }

  async delByPrefix(prefix: string, namespace?: string): Promise<number> {
    const redis = getRedis();
    const pattern = this.prefix(`${prefix}*`, namespace);
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

  /** Pattern delete — SCAN MATCH under cache namespace */
  async deletePattern(pattern: string, namespace?: string): Promise<number> {
    return this.delByPrefix(pattern.replace(/\*$/, ''), namespace);
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheSetOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options.namespace);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, options);
    return value;
  }
}

export const cache = new CacheService();
