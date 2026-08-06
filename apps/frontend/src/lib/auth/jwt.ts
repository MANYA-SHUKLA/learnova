/**
 * JWT client utilities.
 * Access token lives in sessionStorage; refresh token is HttpOnly cookie.
 */

import type { JwtPayload } from '@learnova/types';

const ACCESS_TOKEN_KEY = 'learnova_access_token';
const REFRESH_TOKEN_KEY = 'learnova_refresh_token';

/** Prefer this — refresh token is cookie-only */
export function storeAccessToken(accessToken: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Stores access token only. Refresh argument is ignored (HttpOnly cookie).
 */
export function storeTokens(accessToken: string, _refreshToken?: string): void {
  storeAccessToken(accessToken);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

/** @deprecated Refresh is HttpOnly cookie — always returns null after migration */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Decode JWT payload without verification (client-side display only) */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload, skewSeconds = 30): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}
