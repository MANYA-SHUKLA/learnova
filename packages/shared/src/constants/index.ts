/** Re-export app constants from @learnova/constants for backward compatibility */

export {
  APP_NAME,
  APP_DESCRIPTION,
  API_VERSION,
  API_PREFIX,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  PAGINATION,
  RATE_LIMIT,
  JWT,
  REDIS_KEYS,
  HTTP_HEADERS,
  QUEUE_NAMES,
  CACHE_TTL,
} from '@learnova/constants';

export type { QueueName } from '@learnova/constants';
