import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorDetail } from '@learnova/types';

/**
 * Application error hierarchy — mapped to HTTP by global error handler.
 */
export class AppError extends Error {
  public readonly isOperational = true;

  constructor(
    public readonly code: ApiErrorCode | string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ApiErrorDetail[]) {
    super(API_ERROR_CODES.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(API_ERROR_CODES.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(API_ERROR_CODES.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(API_ERROR_CODES.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(API_ERROR_CODES.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(API_ERROR_CODES.RATE_LIMITED, message, 429);
    this.name = 'RateLimitError';
  }
}
