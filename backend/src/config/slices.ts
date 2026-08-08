/** Typed config facades — validate via env, expose typed slices */

import { env } from './env.js';

export const databaseConfig = {
  uri: env.MONGODB_URI,
  dbName: env.MONGODB_DB_NAME,
  maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
  minPoolSize: env.MONGODB_MIN_POOL_SIZE,
  serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS,
  retryAttempts: env.MONGODB_CONNECT_RETRY_ATTEMPTS,
  retryDelayMs: env.MONGODB_CONNECT_RETRY_DELAY_MS,
} as const;

export const redisConfig = {
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD,
  connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
  maxRetries: env.REDIS_MAX_RETRIES,
  keepAlive: env.REDIS_KEEP_ALIVE_MS,
} as const;

export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtl: env.JWT_REFRESH_TTL,
} as const;

export const socketConfig = {
  path: env.SOCKET_PATH ?? '/socket.io',
  corsOrigins: env.SOCKET_CORS_ORIGINS ?? env.CORS_ORIGINS,
  pingInterval: env.SOCKET_PING_INTERVAL ?? 25_000,
  pingTimeout: env.SOCKET_PING_TIMEOUT ?? 20_000,
} as const;

export const storageConfig = {
  driver: env.STORAGE_DRIVER ?? 'local',
  localPath: env.STORAGE_LOCAL_PATH ?? './uploads',
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
  maxUploadBytes: env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024,
} as const;

export const mailConfig = {
  driver: env.MAIL_DRIVER ?? 'console',
  from: env.MAIL_FROM ?? 'shuklamanya99@gmail.com',
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    secure: env.SMTP_SECURE === 'true',
  },
  resendApiKey: env.RESEND_API_KEY,
  brevoApiKey: env.BREVO_API_KEY,
  queueEnabled: (env.MAIL_QUEUE_ENABLED ?? 'true') !== 'false',
} as const;

export const bullmqConfig = {
  prefix: env.BULLMQ_PREFIX ?? 'learnova',
  attempts: env.BULLMQ_DEFAULT_ATTEMPTS ?? 3,
  backoffMs: env.BULLMQ_BACKOFF_MS ?? 2000,
  removeOnComplete: env.BULLMQ_REMOVE_ON_COMPLETE ?? 1000,
  removeOnFail: env.BULLMQ_REMOVE_ON_FAIL ?? 5000,
  dlqSuffix: env.BULLMQ_DLQ_SUFFIX ?? '-dlq',
} as const;

export const loggingConfig = {
  level: env.LOG_LEVEL,
  pretty:
    env.LOG_PRETTY === 'true' ||
    (env.LOG_PRETTY !== 'false' && env.NODE_ENV === 'development'),
  serviceName: env.LOG_SERVICE_NAME ?? 'learnova-api',
  dir: env.LOG_DIR ?? './logs',
  maxFiles: env.LOG_MAX_FILES ?? 14,
  maxSize: env.LOG_MAX_SIZE ?? '20m',
} as const;

export const securityConfig = {
  headersEnabled: (env.SECURITY_HEADERS_ENABLED ?? 'true') !== 'false',
  csrfEnabled: env.CSRF_ENABLED === 'true',
  csrfCookieName: env.CSRF_COOKIE_NAME ?? 'learnova.csrf',
  encryptionKey: env.ENCRYPTION_KEY,
  bcryptRounds: env.BCRYPT_ROUNDS ?? 12,
  requestTimeoutMs: env.REQUEST_TIMEOUT_MS ?? 30_000,
} as const;

export const corsConfig = {
  origins: (env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
  credentials: (env.CORS_CREDENTIALS ?? 'true') !== 'false',
  methods: (env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
    .split(',')
    .map((m) => m.trim()),
  allowedHeaders: (
    env.CORS_ALLOWED_HEADERS ??
    'Content-Type,Authorization,X-Request-Id,X-Correlation-Id,X-Idempotency-Key'
  )
    .split(',')
    .map((h) => h.trim()),
} as const;

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS ?? 60_000,
  max: env.RATE_LIMIT_MAX ?? 100,
  authMax: env.RATE_LIMIT_AUTH_MAX ?? 20,
  enabled: (env.RATE_LIMIT_ENABLED ?? 'true') !== 'false',
} as const;

export const cookiesConfig = {
  secure: env.COOKIE_SECURE === 'true' || env.NODE_ENV === 'production',
  sameSite: (env.COOKIE_SAME_SITE ?? 'lax'),
  domain: env.COOKIE_DOMAIN,
  path: env.COOKIE_PATH ?? '/',
} as const;

export const sessionConfig = {
  ttlSeconds: env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7,
  prefix: env.SESSION_PREFIX ?? 'session:',
  sliding: (env.SESSION_SLIDING ?? 'true') !== 'false',
} as const;

export const judge0Config = {
  apiUrl: env.JUDGE0_API_URL,
  apiKey: env.JUDGE0_API_KEY,
  timeoutMs: env.JUDGE0_TIMEOUT_MS ?? 15_000,
} as const;
