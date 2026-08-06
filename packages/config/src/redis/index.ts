import { z } from 'zod';

export const redisConfigSchema = z.object({
  REDIS_URL: z.string().url().or(z.string().startsWith('redis')),
  REDIS_PASSWORD: z.string().optional(),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;
