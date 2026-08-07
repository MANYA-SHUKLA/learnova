import type { LearningStatus } from '@learnova/types';

/** Lesson is complete when watch%>=100 OR reading%>=100 OR manually completed */
export function isLessonComplete(input: {
  watchPercentage?: number | null;
  readingPercentage?: number | null;
  manuallyCompleted?: boolean;
}): boolean {
  if (input.manuallyCompleted) return true;
  if ((input.watchPercentage ?? 0) >= 100) return true;
  if ((input.readingPercentage ?? 0) >= 100) return true;
  return false;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeCompletionPercentage(completed: number, total: number): number {
  if (total <= 0) return 0;
  return clampPercent((completed / total) * 100);
}

export function deriveLearningStatus(input: {
  completedCount: number;
  totalCount: number;
  previouslyStarted?: boolean;
  paused?: boolean;
}): LearningStatus {
  if (input.paused) return 'paused';
  if (input.totalCount > 0 && input.completedCount >= input.totalCount) return 'completed';
  if (input.completedCount > 0 || input.previouslyStarted) return 'in_progress';
  return 'not_started';
}

export function secondsToMinutes(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.floor(seconds / 60);
}

export function estimateRemainingMinutes(
  totalEstimatedMinutes: number,
  progressPercentage: number,
): number {
  const remainingRatio = 1 - clampPercent(progressPercentage) / 100;
  return Math.max(0, Math.round(totalEstimatedMinutes * remainingRatio));
}
