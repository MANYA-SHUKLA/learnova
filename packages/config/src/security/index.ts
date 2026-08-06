import { z } from 'zod';

export const securityConfigSchema = z.object({
  SECURITY_HEADERS_ENABLED: z.enum(['true', 'false']).default('true'),
  CSRF_ENABLED: z.enum(['true', 'false']).default('false'),
  CSRF_COOKIE_NAME: z.string().default('learnova.csrf'),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type SecurityConfig = z.infer<typeof securityConfigSchema>;
