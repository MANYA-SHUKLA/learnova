'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storeAccessToken, clearTokens } from '@/lib/auth/jwt';
import { authApi } from '../services/auth-api';
import { useAuthStore } from '../stores/auth-store';

export const authKeys = {
  all: ['auth'] as const,
  me: ['auth', 'me'] as const,
  sessions: ['auth', 'sessions'] as const,
  session: ['auth', 'session'] as const,
};

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.me(),
    enabled,
    staleTime: 60_000,
  });
}

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: () => authApi.getSessions(),
    enabled,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: { email: string; password: string }) => authApi.login(body),
    onSuccess: (data) => {
      storeAccessToken(data.accessToken);
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        session: data.session,
      });
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useRegisterInstitutionMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      institutionName: string;
    }) => authApi.registerInstitution(body),
    onSuccess: (data) => {
      storeAccessToken(data.accessToken);
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        session: data.session,
      });
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const logoutLocal = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logoutLocal();
      clearTokens();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

export function useLogoutAllMutation() {
  const queryClient = useQueryClient();
  const logoutLocal = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSettled: () => {
      logoutLocal();
      clearTokens();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (body: { email: string }) => authApi.forgotPassword(body),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (body: { token: string; password: string }) => authApi.resetPassword(body),
  });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(body),
    onSuccess: (data) => {
      storeAccessToken(data.accessToken);
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        session: data.session,
      });
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (body: { token: string }) => authApi.verifyEmail(body),
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  const logoutLocal = useAuthStore((s) => s.logout);
  const currentSessionId = useAuthStore((s) => s.session?.id);

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: (_data, sessionId) => {
      if (sessionId === currentSessionId) {
        logoutLocal();
        clearTokens();
        queryClient.removeQueries({ queryKey: authKeys.all });
      } else {
        void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
      }
    },
  });
}

export function useRefreshMutation() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: () => authApi.refresh(),
    onSuccess: (data) => {
      storeAccessToken(data.accessToken);
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        session: data.session,
      });
    },
    onError: () => {
      clearTokens();
      clear();
    },
  });
}
