import { createLogger, installProcessErrorHandlers } from '@learnova/logger';
import { loggingConfig } from '../../config/slices.js';

export const logger = createLogger({
  name: loggingConfig.serviceName,
  level: loggingConfig.level,
  pretty: loggingConfig.pretty,
  rotation: {
    enabled: true,
    dir: loggingConfig.dir,
    maxFiles: loggingConfig.maxFiles,
    maxSize: loggingConfig.maxSize,
  },
});

installProcessErrorHandlers(logger);

export type Logger = typeof logger;
