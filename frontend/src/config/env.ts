/**
 * Frontend environment — validated at module load.
 * Public vars only on client.
 */

import { frontendEnvSchema, parseEnv } from '@learnova/config';

function readEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value ?? fallback;
}

function getPublicEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: readEnv('LOG_LEVEL', 'info'),
    NEXT_PUBLIC_APP_URL: readEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    NEXT_PUBLIC_API_URL: readEnv('NEXT_PUBLIC_API_URL', 'http://localhost:4000/api/v1'),
    NEXT_PUBLIC_WS_URL: readEnv('NEXT_PUBLIC_WS_URL', 'http://localhost:4000'),
    NEXT_PUBLIC_DEFAULT_LOCALE: readEnv('NEXT_PUBLIC_DEFAULT_LOCALE', 'en'),
  };
}

export const env = parseEnv(frontendEnvSchema, getPublicEnv());
