import { getSocketServer } from './server-ref.js';

export type ExamLiveEvent =
  | 'live.attempt.updated'
  | 'live.violation.recorded'
  | 'live.attempt.submitted'
  | 'live.attempt.disconnected'
  | 'live.countdown'
  | 'live.announcement'
  | 'live.attendance.updated'
  | 'live.attempt.started'
  | 'live.student.reconnected';

export function examRoomId(examId: string): string {
  return `exam:${examId}`;
}

export function attemptRoomId(attemptId: string): string {
  return `attempt:${attemptId}`;
}

export function emitExamLive(examId: string, event: ExamLiveEvent, payload: unknown): void {
  const io = getSocketServer();
  io?.of('/exam').to(examRoomId(examId)).emit(event, payload);
}

export function emitAttemptLive(attemptId: string, event: ExamLiveEvent, payload: unknown): void {
  const io = getSocketServer();
  io?.of('/exam').to(attemptRoomId(attemptId)).emit(event, payload);
}
