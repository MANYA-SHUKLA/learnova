import { z } from 'zod';

export const rateLimitConfigSchema = z.object({
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true'),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
