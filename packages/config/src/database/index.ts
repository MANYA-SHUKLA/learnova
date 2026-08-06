import { z } from 'zod';

export const databaseConfigSchema = z.object({
  MONGODB_URI: z.string().url().or(z.string().startsWith('mongodb')),
  MONGODB_DB_NAME: z.string().min(1).default('learnova'),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
