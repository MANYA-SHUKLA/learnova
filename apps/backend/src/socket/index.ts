import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { corsConfig, socketConfig } from '../config/slices.js';
import { logger } from '../utils/logger/index.js';

/**
 * Socket.io foundation — namespace scaffolding only.
 * Real-time handlers (IDE, exam proctoring, notifications) come later.
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

  io.of('/ide');
  io.of('/exam');
  io.of('/notifications');

  return io;
}
