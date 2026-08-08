'use client';

/**
 * AuthProvider — hydrates session from access token / refresh cookie,
 * syncs with Zustand auth store.
 */

import type { AuthContextValue, AuthUser, Session } from '@learnova/types';
import { getPermissionsForRole } from '@learnova/shared/permissions';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { authApi } from '@/features/auth/services/auth-api';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import {
  clearTokens,
  decodeJwtPayload,
  getAccessToken,
  isTokenExpired,
  storeAccessToken,
} from '@/lib/auth/jwt';

interface AuthProviderState extends AuthContextValue {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthProviderState | null>(null);

function sessionFromPayload(payload: NonNullable<ReturnType<typeof decodeJwtPayload>>): Session {
  return {
    id: payload.sessionId,
    userId: payload.sub,
    deviceType: 'unknown',
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    createdAt: new Date(payload.iat * 1000).toISOString(),
    lastActivityAt: new Date().toISOString(),
    userAgent: null,
    ipAddress: null,
    browser: null,
    os: null,
    country: null,
    isCurrent: true,
  };
}

/** Prefer API permissions; fall back to role matrix if the payload omitted them. */
export function resolveUserPermissions(user: AuthUser): AuthUser {
  if (user.permissions?.length) return user;
  const fromRole = getPermissionsForRole(user.role);
  return {
    ...user,
    permissions: fromRole ? [...fromRole] : [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const permissions = useAuthStore((s) => s.permissions);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      const timeoutMs = 12_000;
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('AUTH_HYDRATE_TIMEOUT')), timeoutMs);
      });

      try {
        await Promise.race([
          (async () => {
            const token = getAccessToken();
            const payload = token ? decodeJwtPayload(token) : null;
            const tokenUsable = Boolean(token && payload && !isTokenExpired(payload));

            if (token && payload && tokenUsable) {
              try {
                const [meUser, currentSession] = await Promise.all([
                  authApi.me(),
                  authApi.getCurrentSession().catch(() => null),
                ]);
                if (cancelled) return;
                setAuth({
                  user: resolveUserPermissions(meUser),
                  accessToken: token,
                  session: currentSession ?? sessionFromPayload(payload),
                });
                return;
              } catch {
                // Fall through to refresh
              }
            }

            const refreshed = await authApi.refresh();
            if (cancelled) return;
            storeAccessToken(refreshed.accessToken);
            setAuth({
              user: resolveUserPermissions(refreshed.user),
              accessToken: refreshed.accessToken,
              session: refreshed.session,
              roleHint: refreshed.roleHint,
            });
          })(),
          timeout,
        ]);
      } catch {
        if (cancelled) return;
        clearTokens();
        clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [clear, setAuth, setLoading]);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Still clear local state if API fails
    } finally {
      clearTokens();
      clear();
    }
  }, [clear]);

  const value = useMemo<AuthProviderState>(
    () => ({
      user,
      session,
      isAuthenticated,
      isLoading,
      permissions,
      setUser,
      setSession,
      signOut,
    }),
    [user, session, isAuthenticated, isLoading, permissions, setUser, setSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthProviderState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
