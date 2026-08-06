import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorDetail } from '@learnova/types';

export interface ErrorMetadata {
  [key: string]: unknown;
}

/**
 * Application error hierarchy — mapped to HTTP by global error handler.
 */
export class AppError extends Error {
  public readonly isOperational = true;
  public readonly timestamp: string;
  public readonly metadata?: ErrorMetadata;

  constructor(
    public readonly code: ApiErrorCode | string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: ApiErrorDetail[],
    metadata?: ErrorMetadata,
  ) {
    super(message);
    this.name = 'AppError';
    this.timestamp = new Date().toISOString();
    this.metadata = metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ApiErrorDetail[], metadata?: ErrorMetadata) {
    super(API_ERROR_CODES.VALIDATION_ERROR, message, 400, details, metadata);
    this.name = 'ValidationError';
  }
}

/** Alias preferred by infrastructure docs */
export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized', metadata?: ErrorMetadata) {
    super(API_ERROR_CODES.UNAUTHORIZED, message, 401, undefined, metadata);
    this.name = 'AuthenticationError';
  }
}

export class UnauthorizedError extends AuthenticationError {}

export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden', metadata?: ErrorMetadata) {
    super(API_ERROR_CODES.FORBIDDEN, message, 403, undefined, metadata);
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends AuthorizationError {}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', metadata?: ErrorMetadata) {
    super(API_ERROR_CODES.NOT_FOUND, message, 404, undefined, metadata);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', metadata?: ErrorMetadata) {
    super(API_ERROR_CODES.CONFLICT, message, 409, undefined, metadata);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', metadata?: ErrorMetadata) {
    super(API_ERROR_CODES.RATE_LIMITED, message, 429, undefined, metadata);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', metadata?: ErrorMetadata) {
    super('DATABASE_ERROR', message, 503, undefined, metadata);
    this.name = 'DatabaseError';
  }
}

export class RedisError extends AppError {
  constructor(message = 'Redis error', metadata?: ErrorMetadata) {
    super('REDIS_ERROR', message, 503, undefined, metadata);
    this.name = 'RedisError';
  }
}

export class QueueError extends AppError {
  constructor(message = 'Queue error', metadata?: ErrorMetadata) {
    super('QUEUE_ERROR', message, 503, undefined, metadata);
    this.name = 'QueueError';
  }
}

export class StorageError extends AppError {
  constructor(message = 'Storage error', metadata?: ErrorMetadata) {
    super('STORAGE_ERROR', message, 503, undefined, metadata);
    this.name = 'StorageError';
  }
}

export class AIError extends AppError {
  constructor(message = 'AI service error', metadata?: ErrorMetadata) {
    super('AI_ERROR', message, 502, undefined, metadata);
    this.name = 'AIError';
  }
}

export class CompilerError extends AppError {
  constructor(message = 'Compiler / runner error', metadata?: ErrorMetadata) {
    super('COMPILER_ERROR', message, 502, undefined, metadata);
    this.name = 'CompilerError';
  }
}
