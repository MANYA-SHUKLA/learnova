import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger/index.js';

/**
 * Socket.io foundation — namespace scaffolding only.
 * Real-time handlers (IDE, exam proctoring, notifications) come later.
 */
export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected');
    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  // Namespaces prepared for modules
  io.of('/ide');
  io.of('/exam');
  io.of('/notifications');

  return io;
}
