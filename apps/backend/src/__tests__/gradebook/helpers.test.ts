import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { pickAttemptByPolicy } from '../../services/gradebook/gradebook.helpers.js';
import {
  aggregateWeightedPercentage,
  letterGradeFromPercentage,
  sumMarks,
} from '@learnova/shared';

describe('gradebook helpers', () => {
  it('picks best quiz attempt', () => {
    const rows = [
      {
        sourceRefId: new Types.ObjectId(),
        percentage: 70,
        score: 70,
        createdAt: new Date('2026-01-01'),
      },
      {
        sourceRefId: new Types.ObjectId(),
        percentage: 92,
        score: 92,
        createdAt: new Date('2026-01-02'),
      },
    ];
    const picked = pickAttemptByPolicy(rows, 'best');
    expect(picked?.percentage).toBe(92);
  });

  it('aggregates weighted percentages without rescoring marks', () => {
    const weighted = aggregateWeightedPercentage([
      { percentage: 80, weightage: 25 },
      { percentage: 60, weightage: 25 },
    ]);
    expect(weighted).toBe(70);
  });

  it('maps letter grades from percentage bands', () => {
    expect(letterGradeFromPercentage(91)).toBe('A');
    expect(letterGradeFromPercentage(55)).toBe('F');
  });

  it('sums consumed marks only', () => {
    expect(sumMarks([
      { marksObtained: 8, totalMarks: 10 },
      { marksObtained: 15, totalMarks: 20 },
    ])).toEqual({ earned: 23, possible: 30 });
  });
});
