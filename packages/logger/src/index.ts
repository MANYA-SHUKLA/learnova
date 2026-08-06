import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LogDomain =
  | 'request'
  | 'response'
  | 'error'
  | 'database'
  | 'redis'
  | 'socket'
  | 'bullmq'
  | 'audit'
  | 'system';

export interface CreateLoggerOptions {
  name: string;
  level?: LogLevel;
  pretty?: boolean;
  redactPaths?: string[];
  /** Rotation prep — reserved for file transport wiring */
  rotation?: {
    enabled?: boolean;
    dir?: string;
    maxFiles?: number;
    maxSize?: string;
  };
}

const DEFAULT_REDACT = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'GEMINI_API_KEY',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'RESEND_API_KEY',
  'BREVO_API_KEY',
  'ENCRYPTION_KEY',
];

export interface LearnovaLogger {
  info: PinoLogger['info'];
  warn: PinoLogger['warn'];
  error: PinoLogger['error'];
  debug: PinoLogger['debug'];
  fatal: PinoLogger['fatal'];
  trace: PinoLogger['trace'];
  child: PinoLogger['child'];
  audit: (message: string, data?: Record<string, unknown>) => void;
  domain: (domain: LogDomain, level: LogLevel, message: string, data?: Record<string, unknown>) => void;
  raw: PinoLogger;
}

export function createLogger(options: CreateLoggerOptions): LearnovaLogger {
  const opts: LoggerOptions = {
    name: options.name,
    level: options.level ?? 'info',
    base: {
      service: options.name,
      ...(options.rotation?.enabled
        ? { logRotation: { dir: options.rotation.dir, prepared: true } }
        : {}),
    },
    redact: {
      paths: options.redactPaths ?? DEFAULT_REDACT,
      remove: true,
    },
  };

  if (options.pretty) {
    opts.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  const raw = pino(opts);

  const domain: LearnovaLogger['domain'] = (d, level, message, data = {}) => {
    raw[level]({ domain: d, ...data }, message);
  };

  return {
    info: raw.info.bind(raw),
    warn: raw.warn.bind(raw),
    error: raw.error.bind(raw),
    debug: raw.debug.bind(raw),
    fatal: raw.fatal.bind(raw),
    trace: raw.trace.bind(raw),
    child: raw.child.bind(raw),
    audit: (message, data = {}) => {
      raw.info({ audit: true, domain: 'audit', ...data }, message);
    },
    domain,
    raw,
  };
}

/** Install process-level safety nets once per process */
export function installProcessErrorHandlers(logger: LearnovaLogger): void {
  process.on('uncaughtException', (err) => {
    logger.fatal({ err, domain: 'system' }, 'Uncaught exception');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason, domain: 'system' }, 'Unhandled promise rejection');
  });
}

export type { PinoLogger };
