/**
 * Auth middleware — JWT authentication + RBAC guards.
 */

import type { JwtPayload, Permission, Role } from '@learnova/types';
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors/index.js';
import { verifyAccessToken } from '../utils/jwt/index.js';
import { userRepository } from '../repositories/auth/user.repository.js';
import { sessionRepository } from '../repositories/auth/session.repository.js';
import { logAccessDenial } from '../services/audit/access-denial.js';

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
  const { required = true } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    void (async () => {
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
        const payload = verifyAccessToken(token);
        const user = await userRepository.findById(payload.sub);
        if (!user?.isActive) {
          next(new UnauthorizedError('User inactive'));
          return;
        }
        if (user.tokenVersion !== payload.tv) {
          next(new UnauthorizedError('Token revoked'));
          return;
        }
        const session = await sessionRepository.findById(payload.sessionId);
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          next(new UnauthorizedError('Session revoked'));
          return;
        }
        void sessionRepository.touch(payload.sessionId);
        req.user = payload;
        next();
      } catch {
        if (required) {
          next(new UnauthorizedError('Invalid or expired token'));
          return;
        }
        next();
      }
    })();
  };
}

/** Soft auth — attach user when token present, never reject for missing token. */
export function optionalAuthenticate() {
  return authenticate({ required: false });
}

export function requireRole(...roles: Role[]) {
  return requireRoles(...roles);
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Unauthorized'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      void logAccessDenial(req, 'Insufficient role', { requiredRoles: roles });
      next(new ForbiddenError('Insufficient role'));
      return;
    }
    next();
  };
}

export function requirePermission(...permissions: Permission[]) {
  return requirePermissions(...permissions);
}

export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Unauthorized'));
      return;
    }
    const ok = permissions.every((p) => req.user?.permissions.includes(p));
    if (!ok) {
      void logAccessDenial(req, 'Insufficient permissions', { requiredPermissions: permissions });
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}

/**
 * Ensures the authenticated user owns the resource identified by a route param,
 * or is an institution/super admin.
 */
export function requireOwnership(paramKey = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Unauthorized'));
      return;
    }
    const resourceUserId = req.params[paramKey];
    if (!resourceUserId || resourceUserId === req.user.sub) {
      next();
      return;
    }
    if (req.user.role === 'institution_admin' || req.user.role === 'super_admin') {
      next();
      return;
    }
    void logAccessDenial(req, 'Resource ownership required', {
      paramKey,
      resourceUserId,
    });
    next(new ForbiddenError('Resource ownership required'));
  };
}
