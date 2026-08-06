import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface CreateLoggerOptions {
  name: string;
  level?: LogLevel;
  pretty?: boolean;
  redactPaths?: string[];
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
];

export interface LearnovaLogger {
  info: PinoLogger['info'];
  warn: PinoLogger['warn'];
  error: PinoLogger['error'];
  debug: PinoLogger['debug'];
  fatal: PinoLogger['fatal'];
  trace: PinoLogger['trace'];
  child: PinoLogger['child'];
  /** Structured audit trail — always logged at info with audit:true */
  audit: (message: string, data?: Record<string, unknown>) => void;
  raw: PinoLogger;
}

export function createLogger(options: CreateLoggerOptions): LearnovaLogger {
  const opts: LoggerOptions = {
    name: options.name,
    level: options.level ?? 'info',
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

  return {
    info: raw.info.bind(raw),
    warn: raw.warn.bind(raw),
    error: raw.error.bind(raw),
    debug: raw.debug.bind(raw),
    fatal: raw.fatal.bind(raw),
    trace: raw.trace.bind(raw),
    child: raw.child.bind(raw),
    audit: (message, data = {}) => {
      raw.info({ audit: true, ...data }, message);
    },
    raw,
  };
}

export type { PinoLogger };
