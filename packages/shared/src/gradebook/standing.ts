export type AcademicStandingType =
  | 'good_standing'
  | 'academic_warning'
  | 'probation'
  | 'failed_semester'
  | 'honors'
  | 'distinction';

export interface StandingPolicyThresholds {
  probationGpa: number;
  warningGpa: number;
  honorsGpa: number;
  distinctionGpa: number;
  failedCourseLimit: number;
}

export const DEFAULT_STANDING_THRESHOLDS: StandingPolicyThresholds = {
  probationGpa: 1.5,
  warningGpa: 2.0,
  honorsGpa: 3.5,
  distinctionGpa: 3.8,
  failedCourseLimit: 2,
};

export interface StandingInput {
  semesterGpa: number | null;
  cgpa: number | null;
  failedCourseCount: number;
  publishedCourseCount: number;
}

export function computeAcademicStanding(
  input: StandingInput,
  thresholds: StandingPolicyThresholds = DEFAULT_STANDING_THRESHOLDS,
): AcademicStandingType {
  const gpa = input.semesterGpa ?? input.cgpa;

  if (input.failedCourseCount >= thresholds.failedCourseLimit + 1) {
    return 'failed_semester';
  }

  if (gpa != null && gpa >= thresholds.distinctionGpa && input.failedCourseCount === 0) {
    return 'distinction';
  }

  if (gpa != null && gpa >= thresholds.honorsGpa && input.failedCourseCount === 0) {
    return 'honors';
  }

  if (gpa != null && gpa < thresholds.probationGpa) {
    return 'probation';
  }

  if (gpa != null && gpa < thresholds.warningGpa) {
    return 'academic_warning';
  }

  if (input.failedCourseCount >= thresholds.failedCourseLimit) {
    return 'academic_warning';
  }

  return 'good_standing';
}
