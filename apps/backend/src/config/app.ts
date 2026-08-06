import { API_PREFIX } from '@learnova/shared';
import { env } from './env.js';

export const appConfig = {
  name: env.APP_NAME ?? 'Learnova API',
  version: env.APP_VERSION,
  apiPrefix: API_PREFIX,
  env: env.NODE_ENV,
  commitSha: env.GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'unknown',
  host: env.HOST,
  port: env.PORT,
} as const;
