import { describe, expect, it } from 'vitest';
import {
  computeCgpa,
  computeSemesterGpa,
  gradePointsFromPercentage,
  letterGradeFromPercentage,
  resultFromPercentage,
} from '@learnova/shared';

describe('enterprise grade scale', () => {
  it('maps A+ at 97+', () => {
    expect(letterGradeFromPercentage(97)).toBe('A+');
    expect(gradePointsFromPercentage(97)).toBe(4.0);
  });

  it('maps F below 60', () => {
    expect(letterGradeFromPercentage(55)).toBe('F');
    expect(resultFromPercentage(55)).toBe('fail');
  });

  it('computes semester GPA from credit-weighted grade points', () => {
    const gpa = computeSemesterGpa([
      { gradePoints: 4.0, credits: 3 },
      { gradePoints: 3.0, credits: 3 },
    ]);
    expect(gpa).toBe(3.5);
  });

  it('computes CGPA across semesters', () => {
    const cgpa = computeCgpa([
      { semesterGpa: 3.5, totalCredits: 15 },
      { semesterGpa: 3.0, totalCredits: 18 },
    ]);
    expect(cgpa).toBe(3.23);
  });
});
