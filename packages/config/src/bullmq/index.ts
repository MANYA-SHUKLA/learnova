import { z } from 'zod';

export const bullmqConfigSchema = z.object({
  BULLMQ_PREFIX: z.string().default('learnova'),
  BULLMQ_DEFAULT_ATTEMPTS: z.coerce.number().int().positive().default(3),
  BULLMQ_BACKOFF_MS: z.coerce.number().int().positive().default(2000),
  BULLMQ_REMOVE_ON_COMPLETE: z.coerce.number().int().nonnegative().default(1000),
  BULLMQ_REMOVE_ON_FAIL: z.coerce.number().int().nonnegative().default(5000),
  BULLMQ_DLQ_SUFFIX: z.string().default('-dlq'),
});

export type BullmqConfig = z.infer<typeof bullmqConfigSchema>;
