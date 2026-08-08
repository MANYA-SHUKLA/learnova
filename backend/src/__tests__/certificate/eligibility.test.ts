import { describe, expect, it } from 'vitest';
import {
  isCourseCompletionEligible,
  isGraduationCertificateEligible,
  isSemesterRecordEligible,
  isStandingCertificateEligible,
  isTranscriptEligible,
} from '@learnova/shared';

describe('certificate eligibility', () => {
  it('requires published pass grade for course completion', () => {
    expect(isCourseCompletionEligible({ published: true, result: 'pass' }).eligible).toBe(true);
    expect(isCourseCompletionEligible({ published: false, result: 'pass' }).eligible).toBe(false);
    expect(isCourseCompletionEligible({ published: true, result: 'fail' }).eligible).toBe(false);
  });

  it('requires all enrolled courses published for semester record', () => {
    const summaries = [{ published: true, result: 'pass' as const }];
    expect(isSemesterRecordEligible(summaries, 1).eligible).toBe(true);
    expect(isSemesterRecordEligible(summaries, 2).eligible).toBe(false);
  });

  it('allows transcript when at least one published grade exists', () => {
    expect(isTranscriptEligible([{ published: true, result: 'pass' }]).eligible).toBe(true);
    expect(isTranscriptEligible([]).eligible).toBe(false);
  });

  it('requires matching standing for honors/distinction certificates', () => {
    expect(isStandingCertificateEligible('honors', { standing: 'honors' }).eligible).toBe(true);
    expect(isStandingCertificateEligible('distinction', { standing: 'honors' }).eligible).toBe(false);
  });

  it('graduation eligibility reads standing from gradebook without computing GPA', () => {
    expect(isGraduationCertificateEligible({ standing: 'good_standing' }).eligible).toBe(true);
    expect(isGraduationCertificateEligible({ standing: 'probation' }).eligible).toBe(false);
    expect(isGraduationCertificateEligible(null).eligible).toBe(false);
  });
});
