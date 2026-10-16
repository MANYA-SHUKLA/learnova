'use client';

import { SOCKET_NAMESPACES } from '@learnova/constants';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/providers/auth-provider';
import { notificationKeys } from '../hooks/use-notification-queries';

export function useNotificationSocket() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    let socket: Socket | null = null;
    const baseUrl = process.env['NEXT_PUBLIC_API_URL'] ?? '';
    // Wait past React's development setup/cleanup so the handshake is not aborted.
    const timer = window.setTimeout(() => {
      socket = io(`${baseUrl}${SOCKET_NAMESPACES.NOTIFICATIONS}`, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
      });

      socket.on('connect', () => {
        socket?.emit('join', { userId: user.id });
      });

      socket.on('notification.new', () => {
        void qc.invalidateQueries({ queryKey: notificationKeys.all });
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      socket?.disconnect();
    };
  }, [user?.id, qc]);
}
