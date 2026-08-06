import { createLogger } from '@learnova/logger';
import { env } from '../../config/env.js';

export const logger = createLogger({
  name: 'learnova-api',
  level: env.LOG_LEVEL,
  pretty: env.NODE_ENV === 'development',
});

export type Logger = typeof logger;
