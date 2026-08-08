import { describe, expect, it } from 'vitest';
import {
  isLessonComplete,
  clampPercent,
  computeCompletionPercentage,
  deriveLearningStatus,
  estimateRemainingMinutes,
  secondsToMinutes,
} from '../../services/progress/progress.helpers.js';

describe('progress completion rules', () => {
  it('completes lesson when watchPercentage >= 100', () => {
    expect(isLessonComplete({ watchPercentage: 100 })).toBe(true);
    expect(isLessonComplete({ watchPercentage: 99 })).toBe(false);
  });

  it('completes lesson when readingPercentage >= 100', () => {
    expect(isLessonComplete({ readingPercentage: 100 })).toBe(true);
    expect(isLessonComplete({ readingPercentage: 50, watchPercentage: 50 })).toBe(false);
  });

  it('completes lesson when manually completed', () => {
    expect(isLessonComplete({ manuallyCompleted: true, watchPercentage: 0 })).toBe(true);
  });

  it('clamps percent values', () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(33.6)).toBe(34);
  });

  it('computes completion percentage from counts', () => {
    expect(computeCompletionPercentage(0, 0)).toBe(0);
    expect(computeCompletionPercentage(1, 4)).toBe(25);
    expect(computeCompletionPercentage(4, 4)).toBe(100);
  });

  it('derives learning status for module/course rollup', () => {
    expect(
      deriveLearningStatus({ completedCount: 0, totalCount: 5 }),
    ).toBe('not_started');
    expect(
      deriveLearningStatus({ completedCount: 2, totalCount: 5 }),
    ).toBe('in_progress');
    expect(
      deriveLearningStatus({ completedCount: 5, totalCount: 5 }),
    ).toBe('completed');
    expect(
      deriveLearningStatus({ completedCount: 1, totalCount: 5, paused: true }),
    ).toBe('paused');
  });

  it('module completes when all published lessons complete', () => {
    const publishedLessons = 3;
    const completedLessons = 3;
    const status = deriveLearningStatus({
      completedCount: completedLessons,
      totalCount: publishedLessons,
    });
    expect(status).toBe('completed');
    expect(computeCompletionPercentage(completedLessons, publishedLessons)).toBe(100);
  });

  it('course completes when all published modules/lessons complete', () => {
    const published = 10;
    const completed = 10;
    expect(
      deriveLearningStatus({ completedCount: completed, totalCount: published }),
    ).toBe('completed');
  });

  it('estimates remaining minutes from progress', () => {
    expect(estimateRemainingMinutes(100, 50)).toBe(50);
    expect(estimateRemainingMinutes(100, 100)).toBe(0);
  });

  it('converts seconds to whole minutes', () => {
    expect(secondsToMinutes(119)).toBe(1);
    expect(secondsToMinutes(0)).toBe(0);
  });
});
