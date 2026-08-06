import { createLogger, installProcessErrorHandlers } from '@learnova/logger';
import { env } from '../config/env.js';

export const logger = createLogger({
  name: 'learnova-worker',
  level: env.LOG_LEVEL,
  pretty: env.NODE_ENV === 'development',
  rotation: {
    enabled: true,
    dir: env.LOG_DIR ?? './logs',
    maxFiles: env.LOG_MAX_FILES ?? 14,
    maxSize: env.LOG_MAX_SIZE ?? '20m',
  },
});

installProcessErrorHandlers(logger);
