'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notification-api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { q?: string; unreadOnly?: boolean }) =>
    [...notificationKeys.all, 'list', params] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export function useNotificationsQuery(params?: { q?: string; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationApi.list({ ...params, page: 1, limit: 50 }),
    staleTime: 15_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationApi.unreadCount(),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markRead(notificationId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.delete(notificationId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
