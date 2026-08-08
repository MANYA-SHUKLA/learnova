import type { Request } from 'express';
import type { JwtPayload } from '@learnova/types';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

export interface ActorContext {
  userId: string;
  email: string;
  institutionId: string | null;
  role: string;
}

export function actorFromRequest(req: Request): ActorContext {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return actorFromJwt(req.user);
}

export function actorFromJwt(user: JwtPayload): ActorContext {
  return {
    userId: user.sub,
    email: user.email,
    institutionId: user.institutionId,
    role: user.role,
  };
}

export function requireActorTenant(actor: ActorContext): string {
  if (!actor.institutionId) {
    throw new ForbiddenError('Institution context required');
  }
  return actor.institutionId;
}
