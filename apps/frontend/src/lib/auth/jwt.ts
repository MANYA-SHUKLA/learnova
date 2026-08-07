/**
 * JWT client utilities.
 * Access token lives in sessionStorage; refresh token is HttpOnly cookie (API host).
 * A lightweight presence cookie is set on the app origin so Next middleware can gate routes.
 */

import type { JwtPayload } from '@learnova/types';
import { AUTH } from '@learnova/constants';

const ACCESS_TOKEN_KEY = 'learnova_access_token';
const REFRESH_TOKEN_KEY = 'learnova_refresh_token';

function setAuthPresenceCookie(maxAgeSeconds = Math.floor(AUTH.REFRESH_TTL_MS / 1000)): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH.REFRESH_COOKIE_NAME}=1; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearAuthPresenceCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH.REFRESH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Prefer this — refresh token is cookie-only */
export function storeAccessToken(accessToken: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  setAuthPresenceCookie();
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
  clearAuthPresenceCookie();
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
