import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { corsConfig, socketConfig } from '../config/slices.js';
import { logger } from '../utils/logger/index.js';
import { setSocketServer } from './server-ref.js';
import { registerExamNamespace } from './exam.namespace.js';
import { registerNotificationNamespace } from './notifications.namespace.js';

/**
 * Socket.io foundation — namespaces for IDE, exam, notifications, and practice labs.
 */
export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: corsConfig.origins,
      credentials: corsConfig.credentials,
    },
    path: socketConfig.path,
    pingInterval: socketConfig.pingInterval,
    pingTimeout: socketConfig.pingTimeout,
  });

  io.on('connection', (socket) => {
    logger.domain('socket', 'debug', 'Socket connected', { socketId: socket.id });
    socket.on('disconnect', (reason) => {
      logger.domain('socket', 'debug', 'Socket disconnected', { socketId: socket.id, reason });
    });
  });

  const practice = io.of('/practice');
  practice.on('connection', (socket) => {
    logger.domain('socket', 'debug', 'Practice socket connected', { socketId: socket.id });
    socket.on('join', (room: string) => {
      if (typeof room === 'string' && room.length < 200) {
        void socket.join(room);
      }
    });
  });

  io.of('/ide');
  registerExamNamespace(io);
  registerNotificationNamespace(io);

  setSocketServer(io);
  return io;
}
