/** App-level constants that are not roles/permissions/routes */

export const APP_NAME = 'Learnova' as const;
export const APP_DESCRIPTION = 'Enterprise AI Learning Platform' as const;

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const SUPPORTED_LOCALES = ['en', 'hi', 'te'] as const;
export const DEFAULT_LOCALE = 'en' as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 20,
} as const;

export const JWT = {
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '7d',
  ISSUER: 'learnova',
  AUDIENCE: 'learnova-platform',
} as const;

export const REDIS_KEYS = {
  SESSION: 'session:',
  RATE_LIMIT: 'rl:',
  CACHE: 'cache:',
  IDE_SESSION: 'ide:session:',
  QUEUE: 'bull:',
  FEATURE_FLAGS: 'ff:',
  LOCK: 'lock:',
} as const;

export const HTTP_HEADERS = {
  REQUEST_ID: 'x-request-id',
  CORRELATION_ID: 'x-correlation-id',
  IDEMPOTENCY_KEY: 'x-idempotency-key',
} as const;

/** BullMQ queue names — shared by API producers and workers */
export const QUEUE_NAMES = {
  EMAIL: 'email',
  MAIL: 'email',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION: 'notifications',
  CERTIFICATE: 'certificate',
  AI: 'ai',
  COMPILE: 'compile',
  ANALYTICS: 'analytics',
  AUDIT: 'audit',
  CLEANUP: 'cleanup',
  GRADING: 'grading',
} as const;

export type QueueName =
  | 'email'
  | 'notifications'
  | 'certificate'
  | 'ai'
  | 'compile'
  | 'analytics'
  | 'audit'
  | 'cleanup'
  | 'grading';

export const QUEUE_LIST: readonly QueueName[] = [
  'email',
  'notifications',
  'certificate',
  'ai',
  'compile',
  'analytics',
  'audit',
  'cleanup',
  'grading',
] as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3_600,
  DAY: 86_400,
} as const;
