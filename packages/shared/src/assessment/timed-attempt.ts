import type { TimedAttemptContext, TimedAttemptStatus } from '@learnova/types';

export function isTimedAttemptExpired(ctx: TimedAttemptContext, now = new Date()): boolean {
  if (!ctx.durationMinutes) return false;
  const elapsedMs = now.getTime() - ctx.startedAt.getTime();
  return elapsedMs >= ctx.durationMinutes * 60 * 1000;
}

export function remainingAttemptSeconds(ctx: TimedAttemptContext, now = new Date()): number | null {
  if (!ctx.durationMinutes) return null;
  const elapsedMs = now.getTime() - ctx.startedAt.getTime();
  const totalMs = ctx.durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((totalMs - elapsedMs) / 1000));
}

export function computeAttemptDurationSeconds(startedAt: Date, submittedAt: Date): number {
  return Math.max(0, Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000));
}

export function resolveTimedAttemptStatus(
  current: string,
  submitted: boolean,
  expired: boolean,
): TimedAttemptStatus {
  if (expired && !submitted) return 'expired';
  if (submitted) return 'completed';
  if (current === 'abandoned') return 'abandoned';
  return 'started';
}

export function canStartQuestionAttempt(existingCount: number, attemptLimit: number): boolean {
  return existingCount < attemptLimit;
}

export function nextQuestionAttemptNumber(existingCount: number): number {
  return existingCount + 1;
}
