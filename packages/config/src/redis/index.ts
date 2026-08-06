import { z } from 'zod';

export const redisConfigSchema = z.object({
  REDIS_URL: z.string().url().or(z.string().startsWith('redis')),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  REDIS_MAX_RETRIES: z.coerce.number().int().nonnegative().default(10),
  REDIS_KEEP_ALIVE_MS: z.coerce.number().int().positive().default(30_000),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;
