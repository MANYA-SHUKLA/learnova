import { z } from 'zod';
import { databaseConfigSchema } from './database/index.js';
import { redisConfigSchema } from './redis/index.js';
import { jwtConfigSchema } from './jwt/index.js';
import { socketConfigSchema } from './socket/index.js';
import { storageConfigSchema } from './storage/index.js';
import { mailConfigSchema } from './mail/index.js';
import { geminiConfigSchema } from './gemini/index.js';
import { judge0ConfigSchema } from './judge0/index.js';
import { bullmqConfigSchema } from './bullmq/index.js';
import { loggingConfigSchema } from './logging/index.js';
import { securityConfigSchema } from './security/index.js';
import { corsConfigSchema } from './cors/index.js';
import { rateLimitConfigSchema } from './rate-limit/index.js';
import { cookiesConfigSchema } from './cookies/index.js';
import { sessionConfigSchema } from './session/index.js';
import { appConfigSchema } from './app/index.js';

/**
 * Environment validation schemas.
 * Each app validates its own slice at boot — fail fast on misconfiguration.
 */

export const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']);

export const baseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  APP_VERSION: z.string().default('0.1.0'),
  GIT_COMMIT_SHA: z.string().optional(),
});

export const mongoEnvSchema = databaseConfigSchema;
export const redisEnvSchema = redisConfigSchema;
export const jwtEnvSchema = jwtConfigSchema;

export const backendEnvSchema = baseEnvSchema
  .merge(appConfigSchema.partial())
  .merge(databaseConfigSchema)
  .merge(redisConfigSchema)
  .merge(jwtConfigSchema)
  .merge(socketConfigSchema.partial())
  .merge(storageConfigSchema.partial())
  .merge(mailConfigSchema.partial())
  .merge(geminiConfigSchema.partial())
  .merge(judge0ConfigSchema.partial())
  .merge(bullmqConfigSchema.partial())
  .merge(loggingConfigSchema.partial())
  .merge(securityConfigSchema.partial())
  .merge(corsConfigSchema.partial())
  .merge(rateLimitConfigSchema.partial())
  .merge(cookiesConfigSchema.partial())
  .merge(sessionConfigSchema.partial())
  .extend({
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default('0.0.0.0'),
  });

export const frontendEnvSchema = baseEnvSchema.extend({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_WS_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['en', 'hi', 'te']).default('en'),
});

export const workerEnvSchema = baseEnvSchema
  .merge(databaseConfigSchema)
  .merge(redisConfigSchema)
  .merge(mailConfigSchema.partial())
  .merge(geminiConfigSchema.partial())
  .merge(judge0ConfigSchema.partial())
  .merge(bullmqConfigSchema.partial())
  .merge(loggingConfigSchema.partial())
  .extend({
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
    WORKER_HEALTH_PORT: z.coerce.number().int().positive().default(4100),
  });

export type BackendEnv = z.infer<typeof backendEnvSchema>;
export type FrontendEnv = z.infer<typeof frontendEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.output<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ') ?? 'invalid'}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${message}`);
  }
  return result.data as z.output<T>;
}
