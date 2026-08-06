import { z } from 'zod';

export const mailConfigSchema = z.object({
  MAIL_DRIVER: z.enum(['console', 'smtp', 'ses']).default('console'),
  MAIL_FROM: z.string().email().default('noreply@learnova.local'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
});

export type MailConfig = z.infer<typeof mailConfigSchema>;
