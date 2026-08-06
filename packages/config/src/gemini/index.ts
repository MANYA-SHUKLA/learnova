import { z } from 'zod';

export const geminiConfigSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_MAX_TOKENS: z.coerce.number().int().positive().default(2048),
});

export type GeminiConfig = z.infer<typeof geminiConfigSchema>;
