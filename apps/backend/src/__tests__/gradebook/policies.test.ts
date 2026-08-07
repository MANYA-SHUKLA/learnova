import { describe, expect, it } from 'vitest';
import {
  computeGpaWithFormula,
  evaluatePassFail,
  resolveAssessmentPurpose,
  selectGradeByReplacementPolicy,
} from '@learnova/shared';

describe('gradebook academic policies', () => {
  it('evaluates pass when both marks and grade criteria are met', () => {
    expect(
      evaluatePassFail({
        percentage: 72,
        letterGrade: 'B',
        marksObtained: 72,
        totalMarks: 100,
        passingMarks: 60,
      }),
    ).toBe('pass');
  });

  it('evaluates fail when grade criteria fails in both mode', () => {
    expect(
      evaluatePassFail(
        {
          percentage: 72,
          letterGrade: 'F',
          marksObtained: 72,
          totalMarks: 100,
          passingMarks: 60,
        },
        {
          passingCriteria: 'both',
          passingPercentage: 60,
          passingGradeLetters: ['A', 'B', 'C'],
        },
      ),
    ).toBe('fail');
  });

  it('selects highest percentage for replace_if_higher policy', () => {
    const selected = selectGradeByReplacementPolicy(
      [
        { percentage: 55, consumedAt: '2026-01-01', sourceRefId: 'a' },
        { percentage: 68, consumedAt: '2026-02-01', sourceRefId: 'b' },
      ],
      'replace_if_higher',
    );
    expect(selected?.sourceRefId).toBe('b');
  });

  it('computes arithmetic mean GPA formula', () => {
    const gpa = computeGpaWithFormula(
      [
        { gradePoints: 4, credits: 3 },
        { gradePoints: 2, credits: 3 },
      ],
      'arithmetic_mean',
    );
    expect(gpa).toBe(3);
  });

  it('maps supplementary exam types to assessment purpose', () => {
    expect(resolveAssessmentPurpose('supplementary')).toBe('supplementary');
    expect(resolveAssessmentPurpose('mock')).toBe('improvement');
    expect(resolveAssessmentPurpose('final')).toBe('regular');
  });
});
