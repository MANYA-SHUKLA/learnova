import type { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger/index.js';
import { attemptRoomId, examRoomId } from './exam-live.js';

function joinRoom(socket: Socket, room: string): void {
  if (typeof room === 'string' && room.length > 0 && room.length < 200) {
    void socket.join(room);
    logger.domain('socket', 'debug', 'Exam socket joined room', { socketId: socket.id, room });
  }
}

/**
 * Live exam monitoring namespace — faculty dashboards and student attempt rooms.
 */
export function registerExamNamespace(io: Server): void {
  const examNs = io.of('/exam');

  examNs.on('connection', (socket) => {
    logger.domain('socket', 'debug', 'Exam socket connected', { socketId: socket.id });

    socket.on('join.exam', (examId: string) => {
      if (typeof examId === 'string') joinRoom(socket, examRoomId(examId));
    });

    socket.on('join.attempt', (attemptId: string) => {
      if (typeof attemptId === 'string') joinRoom(socket, attemptRoomId(attemptId));
    });

    socket.on('leave.exam', (examId: string) => {
      if (typeof examId === 'string') void socket.leave(examRoomId(examId));
    });

    socket.on('leave.attempt', (attemptId: string) => {
      if (typeof attemptId === 'string') void socket.leave(attemptRoomId(attemptId));
    });

    socket.on('disconnect', (reason) => {
      logger.domain('socket', 'debug', 'Exam socket disconnected', { socketId: socket.id, reason });
    });
  });
}
