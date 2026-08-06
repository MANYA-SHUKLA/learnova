import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { getRedis } from '../database/redis/connection.js';
import { RateLimitError } from '../utils/errors/index.js';

/**
 * Rate limiter — Redis-backed when available, memory fallback for boot.
 */
export function createRateLimiter() {
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const max = env.RATE_LIMIT_MAX;

  try {
    const redis = getRedis();
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) =>
          redis.call(args[0] as string, ...args.slice(1)) as Promise<number>,
      }),
      handler: () => {
        throw new RateLimitError();
      },
    });
  } catch {
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: () => {
        throw new RateLimitError();
      },
    });
  }
}
