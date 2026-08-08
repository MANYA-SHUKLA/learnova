import { describe, expect, it } from 'vitest';
import { issueCertificateSchema, publishCertificateSchema, issueTranscriptSchema } from '@learnova/validation';

describe('certificate enterprise validation', () => {
  it('accepts publish flag on issue payload', () => {
    const parsed = issueCertificateSchema.safeParse({
      studentId: '507f1f77bcf86cd799439011',
      documentType: 'lab_completion',
      courseId: '507f1f77bcf86cd799439012',
      activityId: '507f1f77bcf86cd799439013',
      publish: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('validates publish and transcript payloads', () => {
    expect(
      publishCertificateSchema.safeParse({ certificateId: '507f1f77bcf86cd799439011' }).success,
    ).toBe(true);
    expect(
      issueTranscriptSchema.safeParse({
        studentId: '507f1f77bcf86cd799439011',
        transcriptType: 'official',
      }).success,
    ).toBe(true);
  });
});
