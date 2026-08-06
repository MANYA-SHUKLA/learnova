'use client';

import type { AuthUser, Permission, Session } from '@learnova/types';
import { create } from 'zustand';
import { clearTokens } from '@/lib/auth/jwt';

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
    set({
      user,
      accessToken,
      session,
      permissions: user.permissions,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => {
    set((state) => ({
      user,
      permissions: user?.permissions ?? [],
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
    set({ ...empty, isLoading: false });
  },

  logout: () => {
    clearTokens();
    set({ ...empty, isLoading: false });
  },
}));
