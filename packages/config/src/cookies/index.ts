import { z } from 'zod';

export const cookiesConfigSchema = z.object({
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_PATH: z.string().default('/'),
});

export type CookiesConfig = z.infer<typeof cookiesConfigSchema>;
