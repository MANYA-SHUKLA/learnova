import { z } from 'zod';

export const databaseConfigSchema = z.object({
  MONGODB_URI: z.string().url().or(z.string().startsWith('mongodb')),
  MONGODB_DB_NAME: z.string().min(1).default('learnova'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(20),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().int().nonnegative().default(2),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  MONGODB_CONNECT_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(5),
  MONGODB_CONNECT_RETRY_DELAY_MS: z.coerce.number().int().positive().default(2000),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
