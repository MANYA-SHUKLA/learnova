/**
 * Frontend environment — validated at module load.
 * Public vars only on client.
 */

import { frontendEnvSchema, parseEnv } from '@learnova/config';

function getPublicEnv() {
  return {
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
    NEXT_PUBLIC_API_URL:
      process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_WS_URL: process.env['NEXT_PUBLIC_WS_URL'] ?? 'http://localhost:4000',
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env['NEXT_PUBLIC_DEFAULT_LOCALE'] ?? 'en',
  };
}

export const env = parseEnv(frontendEnvSchema, getPublicEnv() as NodeJS.ProcessEnv);
