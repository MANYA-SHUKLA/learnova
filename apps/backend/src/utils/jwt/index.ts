/**
 * JWT utilities — access + refresh with rotation metadata.
 */

import jwt from 'jsonwebtoken';
import type { JwtPayload, RefreshTokenPayload } from '@learnova/types';
import { JWT } from '@learnova/constants';
import { env } from '../../config/env.js';

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL ?? JWT.ACCESS_TOKEN_TTL,
    issuer: JWT.ISSUER,
    audience: JWT.AUDIENCE,
  } as jwt.SignOptions);
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>,
): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL ?? JWT.REFRESH_TOKEN_TTL,
    issuer: JWT.ISSUER,
    audience: JWT.AUDIENCE,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: JWT.ISSUER,
    audience: JWT.AUDIENCE,
  }) as JwtPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: JWT.ISSUER,
    audience: JWT.AUDIENCE,
  }) as RefreshTokenPayload;
}

/** Approximate access-token TTL in seconds for client `expiresIn`. */
export function accessTokenExpiresInSeconds(): number {
  const ttl = env.JWT_ACCESS_TTL ?? JWT.ACCESS_TOKEN_TTL;
  if (ttl.endsWith('m')) return Number.parseInt(ttl, 10) * 60;
  if (ttl.endsWith('h')) return Number.parseInt(ttl, 10) * 3600;
  if (ttl.endsWith('d')) return Number.parseInt(ttl, 10) * 86_400;
  if (ttl.endsWith('s')) return Number.parseInt(ttl, 10);
  return 900;
}
