import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors/index.js';

type RequestTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory — Zod schemas as the validation layer.
 */
export function validate(schema: ZodSchema, target: RequestTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(
        new ValidationError(
          'Validation failed',
          result.error.errors.map((e) => ({
            field: e.path.join('.'),
            code: e.code,
            message: e.message,
          })),
        ),
      );
      return;
    }
    req[target] = result.data;
    next();
  };
}
