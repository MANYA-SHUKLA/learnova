'use client';

import type { AuthUser, Permission, Session } from '@learnova/types';
import { getPermissionsForRole } from '@learnova/shared/permissions';
import { create } from 'zustand';
import { clearTokens, syncRoleCookieFromUser } from '@/lib/auth/jwt';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  session: Session | null;
  permissions: Permission[];
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (payload: {
    user: AuthUser;
    accessToken: string;
    session: Session;
  }) => void;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
  /** Local logout — clears store + sessionStorage tokens */
  logout: () => void;
}

function permissionsFor(user: AuthUser | null): Permission[] {
  if (!user) return [];
  if (user.permissions?.length) return user.permissions;
  const fromRole = getPermissionsForRole(user.role);
  return fromRole ? [...fromRole] : [];
}

const empty = {
  user: null as AuthUser | null,
  accessToken: null as string | null,
  session: null as Session | null,
  permissions: [] as Permission[],
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...empty,
  isLoading: true,

  setAuth: ({ user, accessToken, session }) => {
    const permissions = permissionsFor(user);
    syncRoleCookieFromUser(user.role);
    set({
      user: { ...user, permissions },
      accessToken,
      session,
      permissions,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => {
    const permissions = permissionsFor(user);
    syncRoleCookieFromUser(user?.role);
    set((state) => ({
      user: user ? { ...user, permissions } : null,
      permissions,
      isAuthenticated: Boolean(user && state.session),
    }));
  },

  setSession: (session) => {
    set((state) => ({
      session,
      isAuthenticated: Boolean(state.user && session),
    }));
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  clear: () => {
    clearTokens();
    set({ ...empty, isLoading: false });
  },

  logout: () => {
    clearTokens();
    set({ ...empty, isLoading: false });
  },
}));
