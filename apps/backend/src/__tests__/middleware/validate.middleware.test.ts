import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';

function makeGetterOnlyReq(query: Record<string, unknown>) {
  const req = {} as Request & { _q?: Record<string, unknown> };
  Object.defineProperty(req, 'query', {
    get() {
      return (this._q ??= { ...query });
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(req, 'body', {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(req, 'params', {
    get() {
      return {};
    },
    enumerable: true,
    configurable: true,
  });
  return req;
}

describe('validate middleware (Express 5 query)', () => {
  it('mutates getter-only req.query without reassignment', () => {
    const schema = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
    });
    const req = makeGetterOnlyReq({ page: '2', limit: '50' });
    const next = vi.fn() as unknown as NextFunction;

    validate(schema, 'query')(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query.page).toBe(2);
    expect(req.query.limit).toBe(50);

    expect(() => {
      (req as { query: unknown }).query = { page: 1 };
    }).toThrow(/only a getter|Cannot set property query/i);
  });

  it('rejects invalid query via next(ValidationError)', () => {
    const schema = z.object({
      page: z.coerce.number().int().positive(),
    });
    const req = makeGetterOnlyReq({ page: '-1' });
    const next = vi.fn() as unknown as NextFunction;

    validate(schema, 'query')(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      message?: string;
    };
    expect(err).toBeTruthy();
    expect(String(err.message ?? err)).toMatch(/Validation failed/i);
  });
});
