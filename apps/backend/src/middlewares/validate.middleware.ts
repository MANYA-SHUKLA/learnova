import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors/index.js';

type RequestTarget = 'body' | 'query' | 'params';

function replaceRequestBag(
  target: Record<string, unknown>,
  data: unknown,
): void {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, data as Record<string, unknown>);
}

/**
 * Validation middleware factory — Zod schemas as the validation layer.
 * Express 5: `req.query` / `req.params` are getter-only — mutate the returned
 * object in place instead of reassigning the property.
 */
export function validate(schema: ZodSchema<unknown>, target: RequestTarget = 'body') {
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
    if (target === 'body') {
      req.body = result.data;
    } else if (target === 'query') {
      replaceRequestBag(req.query as Record<string, unknown>, result.data);
    } else {
      replaceRequestBag(req.params as Record<string, unknown>, result.data);
    }
    next();
  };
}
