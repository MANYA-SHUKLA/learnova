import type { CookieOptions, Request, Response } from 'express';
import { AUTH } from '@learnova/constants';
import { cookiesConfig } from '../config/slices.js';

export function refreshCookieOptions(maxAgeMs = AUTH.REFRESH_TTL_MS): CookieOptions {
  return {
    httpOnly: true,
    secure: cookiesConfig.secure,
    sameSite: cookiesConfig.sameSite as CookieOptions['sameSite'],
    domain: cookiesConfig.domain,
    path: cookiesConfig.path,
    maxAge: maxAgeMs,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(AUTH.REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(AUTH.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: cookiesConfig.secure,
    sameSite: cookiesConfig.sameSite as CookieOptions['sameSite'],
    domain: cookiesConfig.domain,
    path: cookiesConfig.path,
  });
}

export function readRefreshToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[AUTH.REFRESH_COOKIE_NAME] as string | undefined;
  if (fromCookie) return fromCookie;
  const body = req.body as { refreshToken?: string } | undefined;
  return body?.refreshToken;
}

export function getClientContext(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded =
    typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return {
    ipAddress: ipFromForwarded || req.ip || null,
    userAgent: req.headers['user-agent'] ?? null,
    correlationId: req.requestId ?? null,
  };
}
