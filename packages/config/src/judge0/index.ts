import { z } from 'zod';

export const judge0ConfigSchema = z.object({
  JUDGE0_API_URL: z.string().url().optional(),
  JUDGE0_API_KEY: z.string().optional(),
  JUDGE0_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
});

export type Judge0Config = z.infer<typeof judge0ConfigSchema>;
