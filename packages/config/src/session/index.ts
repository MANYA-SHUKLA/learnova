import { z } from 'zod';

export const sessionConfigSchema = z.object({
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  SESSION_PREFIX: z.string().default('session:'),
  SESSION_SLIDING: z.enum(['true', 'false']).default('true'),
});

export type SessionConfig = z.infer<typeof sessionConfigSchema>;
