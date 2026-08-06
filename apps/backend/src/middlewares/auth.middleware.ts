/**
 * Auth middleware — PREPARED only.
 * Verifies Bearer JWT when present; does not implement login.
 * Soft-fail mode until auth feature ships (attach user if valid, else continue).
 */

import type { JwtPayload, Permission, Role } from '@learnova/types';
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors/index.js';
import { verifyAccessToken } from '../utils/jwt/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthMiddlewareOptions {
  /** When true, reject unauthenticated requests. Default false (soft). */
  required?: boolean;
}

export function authenticate(options: AuthMiddlewareOptions = {}) {
  const { required = false } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      if (required) {
        next(new UnauthorizedError('Missing bearer token'));
        return;
      }
      next();
      return;
    }

    const token = header.slice(7);
    try {
      req.user = verifyAccessToken(token);
      next();
    } catch {
      if (required) {
        next(new UnauthorizedError('Invalid or expired token'));
        return;
      }
      next();
    }
  };
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }
    next();
  };
}

export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    const ok = permissions.every((p) => req.user?.permissions.includes(p));
    if (!ok) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}
