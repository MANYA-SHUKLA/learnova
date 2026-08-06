import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { rateLimitConfig } from '../config/slices.js';
import { getRedis } from '../database/redis/connection.js';
import { RateLimitError } from '../utils/errors/index.js';
import type { RequestHandler } from 'express';

/**
 * Rate limiter — Redis-backed when available, memory fallback for boot.
 */
export function createRateLimiter(): RequestHandler {
  if (!rateLimitConfig.enabled) {
    return (_req, _res, next) => next();
  }

  const windowMs = rateLimitConfig.windowMs;
  const max = rateLimitConfig.max;

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
