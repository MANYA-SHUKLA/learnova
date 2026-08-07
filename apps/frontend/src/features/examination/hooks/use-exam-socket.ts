'use client';

import { SOCKET_NAMESPACES } from '@learnova/constants';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { useExamStore } from '../store/exam-store';

export function useExamSocket(options: {
  examId?: string | null;
  attemptId?: string | null;
  enabled?: boolean;
}) {
  const socketRef = useRef<Socket | null>(null);
  const setLiveStats = useExamStore((s) => s.setLiveStats);
  const setRemainingSeconds = useExamStore((s) => s.setRemainingSeconds);
  const incrementViolations = useExamStore((s) => s.incrementViolations);
  const addWarning = useExamStore((s) => s.addWarning);

  useEffect(() => {
    if (!options.enabled) return;

    const socket = io(`${env.NEXT_PUBLIC_WS_URL}${SOCKET_NAMESPACES.EXAM}`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('live.countdown', (payload: { remainingSeconds?: number }) => {
      if (typeof payload.remainingSeconds === 'number') {
        setRemainingSeconds(payload.remainingSeconds);
      }
    });

    socket.on(
      'live.violation.recorded',
      (payload: { violationType?: string; violationCount?: number }) => {
        incrementViolations();
        if (payload.violationType) addWarning(payload.violationType);
      },
    );

    socket.on(
      'live.attempt.updated',
      (payload: { stats?: { online: number; started: number; submitted: number } }) => {
        if (payload.stats) {
          setLiveStats({
            online: payload.stats.online,
            started: payload.stats.started,
            submitted: payload.stats.submitted,
            disconnected: 0,
            warnings: 0,
            violations: 0,
          });
        }
      },
    );

    socket.on('connect', () => {
      if (options.examId) socket.emit('join.exam', options.examId);
      if (options.attemptId) socket.emit('join.attempt', options.attemptId);
    });

    return () => {
      if (options.examId) socket.emit('leave.exam', options.examId);
      if (options.attemptId) socket.emit('leave.attempt', options.attemptId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    options.enabled,
    options.examId,
    options.attemptId,
    setLiveStats,
    setRemainingSeconds,
    incrementViolations,
    addWarning,
  ]);

  return socketRef;
}
