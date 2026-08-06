'use client';

/**
 * AuthProvider — prepared foundation.
 * Hydrates empty session until login is implemented.
 * Consumers can already wire to useAuth().
 */

import type { AuthContextValue, AuthUser, Permission, Session } from '@learnova/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { destroySession, getEmptySession, probeLocalSession } from '@/lib/auth/session';

interface AuthProviderState extends AuthContextValue {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthProviderState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const local = probeLocalSession();
    setUser(local.user);
    setSession(local.session);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    destroySession();
    const empty = getEmptySession();
    setUser(empty.user);
    setSession(empty.session);
  }, []);

  const permissions: Permission[] = user?.permissions ?? [];

  const value = useMemo<AuthProviderState>(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user && session),
      isLoading,
      permissions,
      setUser,
      setSession,
      signOut,
    }),
    [user, session, isLoading, permissions, signOut],
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
