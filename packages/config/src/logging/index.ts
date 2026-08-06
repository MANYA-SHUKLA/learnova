import { z } from 'zod';

export const loggingConfigSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.enum(['true', 'false']).optional(),
  LOG_SERVICE_NAME: z.string().default('learnova'),
  /** Rotation prep — path reserved for future pino-roll / file transport */
  LOG_DIR: z.string().default('./logs'),
  LOG_MAX_FILES: z.coerce.number().int().positive().default(14),
  LOG_MAX_SIZE: z.string().default('20m'),
});

export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
