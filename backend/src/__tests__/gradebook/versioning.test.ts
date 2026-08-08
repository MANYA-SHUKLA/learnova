import { describe, expect, it } from 'vitest';
import { compareGradeSnapshots } from '@learnova/shared';

describe('grade snapshot versioning', () => {
  it('detects summary field changes between versions', () => {
    const diff = compareGradeSnapshots(
      {
        version: 1,
        summary: {
          percentage: 72,
          letterGrade: 'B',
          gradePoints: 3,
          result: 'pass',
          finalMarks: 72,
          totalMarksEarned: 72,
          totalMarksPossible: 100,
        },
        entries: [{ activityKind: 'quiz', activityTitle: 'Quiz 1', percentage: 72, marksObtained: 18, totalMarks: 25, weightage: 10 }],
        frozenAt: '2026-01-01T00:00:00.000Z',
      },
      {
        version: 2,
        summary: {
          percentage: 78,
          letterGrade: 'B+',
          gradePoints: 3.3,
          result: 'pass',
          finalMarks: 78,
          totalMarksEarned: 78,
          totalMarksPossible: 100,
        },
        entries: [
          { activityKind: 'quiz', activityTitle: 'Quiz 1', percentage: 72, marksObtained: 18, totalMarks: 25, weightage: 10 },
          { activityKind: 'exam', activityTitle: 'Final', percentage: 84, marksObtained: 42, totalMarks: 50, weightage: 30 },
        ],
        frozenAt: '2026-02-01T00:00:00.000Z',
      },
    );

    expect(diff.versionFrom).toBe(1);
    expect(diff.versionTo).toBe(2);
    expect(diff.entryCountDelta).toBe(1);
    expect(diff.summaryChanges.some((change) => change.field === 'percentage')).toBe(true);
  });
});
