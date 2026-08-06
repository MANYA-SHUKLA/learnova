/**
 * Session manager — prepared scaffold.
 * Will hydrate from API / cookie when auth is implemented.
 */

import type { AuthUser, Session } from '@learnova/types';
import { clearTokens, getAccessToken, decodeJwtPayload, isTokenExpired } from './jwt';

export interface SessionState {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
}

export function getEmptySession(): SessionState {
  return {
    user: null,
    session: null,
    isAuthenticated: false,
  };
}

/**
 * Lightweight client session probe from stored JWT.
 * Does NOT call the API — foundation only.
 */
export function probeLocalSession(): SessionState {
  const token = getAccessToken();
  if (!token) return getEmptySession();

  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) {
    clearTokens();
    return getEmptySession();
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      firstName: '',
      lastName: '',
      role: payload.role as AuthUser['role'],
      institutionId: payload.institutionId,
      permissions: payload.permissions,
      locale: 'en',
      avatarUrl: null,
    },
    session: {
      id: payload.sessionId,
      userId: payload.sub,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      createdAt: new Date(payload.iat * 1000).toISOString(),
      userAgent: null,
      ipAddress: null,
    },
    isAuthenticated: true,
  };
}

export function destroySession(): void {
  clearTokens();
}
