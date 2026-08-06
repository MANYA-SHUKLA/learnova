import { API_ERROR_CODES } from '@learnova/types';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors/index.js';
import { logger } from '../utils/logger/index.js';
import { sendError } from '../utils/response/index.js';

/**
 * Global error handler — last middleware in the chain.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    logger.warn(
      { err, requestId, code: err.code },
      err.message,
    );
    sendError(res, {
      status: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, {
      status: 400,
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        code: e.code,
        message: e.message,
      })),
      requestId,
    });
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');
  sendError(res, {
    status: 500,
    code: API_ERROR_CODES.INTERNAL_ERROR,
    message: 'Internal server error',
    requestId,
  });
}
