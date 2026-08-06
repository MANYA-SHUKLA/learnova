'use client';

/**
 * AuthProvider — hydrates session from access token / refresh cookie,
 * syncs with Zustand auth store.
 */

import type { AuthContextValue, AuthUser, Session } from '@learnova/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      try {
        const token = getAccessToken();
        const payload = token ? decodeJwtPayload(token) : null;
        const tokenUsable = Boolean(payload && !isTokenExpired(payload));

        if (tokenUsable) {
          try {
            const [meUser, currentSession] = await Promise.all([
              authApi.me(),
              authApi.getCurrentSession().catch(() => null),
            ]);
            if (cancelled) return;
            setAuth({
              user: meUser,
              accessToken: token!,
              session:
                currentSession ??
                ({
                  id: payload!.sessionId,
                  userId: payload!.sub,
                  deviceType: 'unknown',
                  expiresAt: new Date(payload!.exp * 1000).toISOString(),
                  createdAt: new Date(payload!.iat * 1000).toISOString(),
                  lastActivityAt: new Date().toISOString(),
                  userAgent: null,
                  ipAddress: null,
                  browser: null,
                  os: null,
                  country: null,
                  isCurrent: true,
                } satisfies Session),
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
          user: refreshed.user,
          accessToken: refreshed.accessToken,
          session: refreshed.session,
        });
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
