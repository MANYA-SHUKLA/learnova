import { z } from 'zod';

export const corsConfigSchema = z.object({
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.enum(['true', 'false']).default('true'),
  CORS_METHODS: z.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: z
    .string()
    .default('Content-Type,Authorization,X-Request-Id,X-Correlation-Id,X-Idempotency-Key'),
});

export type CorsConfig = z.infer<typeof corsConfigSchema>;
