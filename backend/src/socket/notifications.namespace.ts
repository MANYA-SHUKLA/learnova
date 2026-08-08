import type { Server } from 'socket.io';
import { logger } from '../utils/logger/index.js';

/** User-scoped notification namespace — clients join `user:{userId}` rooms. */
export function registerNotificationNamespace(io: Server): void {
  const ns = io.of('/notifications');

  ns.on('connection', (socket) => {
    socket.on('join', (payload: { userId?: string }) => {
      const userId = payload?.userId;
      if (typeof userId === 'string' && userId.length >= 12 && userId.length <= 64) {
        void socket.join(`user:${userId}`);
        logger.domain('socket', 'debug', 'Notification room joined', { userId, socketId: socket.id });
      }
    });

    socket.on('disconnect', () => {
      logger.domain('socket', 'debug', 'Notification socket disconnected', { socketId: socket.id });
    });
  });
}
