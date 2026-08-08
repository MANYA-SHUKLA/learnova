'use client';

import { SOCKET_NAMESPACES } from '@learnova/constants';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/providers/auth-provider';
import { notificationKeys } from '../hooks/use-notification-queries';

let socket: Socket | null = null;

export function useNotificationSocket() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const baseUrl = process.env['NEXT_PUBLIC_API_URL'] ?? '';
    socket = io(`${baseUrl}${SOCKET_NAMESPACES.NOTIFICATIONS}`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket?.emit('join', { userId: user.id });
    });

    socket.on('notification.new', () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user?.id, qc]);
}
