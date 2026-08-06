import { z } from 'zod';

export const mailConfigSchema = z.object({
  MAIL_DRIVER: z.enum(['console', 'smtp', 'ses', 'resend', 'brevo', 'nodemailer']).default('console'),
  MAIL_FROM: z.string().email().default('shuklamanya99@gmail.com'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  RESEND_API_KEY: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  MAIL_QUEUE_ENABLED: z.enum(['true', 'false']).default('true'),
});

export type MailConfig = z.infer<typeof mailConfigSchema>;
