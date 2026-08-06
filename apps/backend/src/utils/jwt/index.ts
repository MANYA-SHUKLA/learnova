/**
 * JWT utilities — prepared for auth implementation.
 * Sign / verify helpers only. No login endpoints.
 */

import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@learnova/types';
import { env } from '../../config/env.js';

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: 'learnova',
    audience: 'learnova-platform',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: Pick<JwtPayload, 'sub' | 'sessionId'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
    issuer: 'learnova',
    audience: 'learnova-platform',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'learnova',
    audience: 'learnova-platform',
  }) as JwtPayload;
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, 'sub' | 'sessionId'> {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'learnova',
    audience: 'learnova-platform',
  }) as Pick<JwtPayload, 'sub' | 'sessionId'>;
}
