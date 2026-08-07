import { describe, expect, it } from 'vitest';
import { computeAcademicStanding } from '@learnova/shared';

describe('academic standing', () => {
  const thresholds = {
    probationGpa: 1.5,
    warningGpa: 2.0,
    honorsGpa: 3.5,
    distinctionGpa: 3.8,
    failedCourseLimit: 2,
  };

  it('returns distinction for high GPA with no failures', () => {
    expect(
      computeAcademicStanding(
        { semesterGpa: 3.9, cgpa: 3.9, failedCourseCount: 0, publishedCourseCount: 5 },
        thresholds,
      ),
    ).toBe('distinction');
  });

  it('returns probation when GPA is below threshold', () => {
    expect(
      computeAcademicStanding(
        { semesterGpa: 1.2, cgpa: 1.2, failedCourseCount: 0, publishedCourseCount: 4 },
        thresholds,
      ),
    ).toBe('probation');
  });

  it('returns failed_semester when failures exceed limit', () => {
    expect(
      computeAcademicStanding(
        { semesterGpa: 2.5, cgpa: 2.5, failedCourseCount: 3, publishedCourseCount: 6 },
        thresholds,
      ),
    ).toBe('failed_semester');
  });

  it('returns good standing by default', () => {
    expect(
      computeAcademicStanding(
        { semesterGpa: 2.8, cgpa: 2.8, failedCourseCount: 0, publishedCourseCount: 5 },
        thresholds,
      ),
    ).toBe('good_standing');
  });
});
