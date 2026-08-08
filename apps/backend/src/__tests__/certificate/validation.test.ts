import { describe, expect, it } from 'vitest';
import { issueCertificateSchema } from '@learnova/validation';
import { generateVerificationCode, normalizeVerificationCode } from '@learnova/shared/certificate/crypto';

describe('certificate validation', () => {
  it('validates issue certificate payload', () => {
    const parsed = issueCertificateSchema.safeParse({
      studentId: '507f1f77bcf86cd799439011',
      documentType: 'course_completion',
      courseId: '507f1f77bcf86cd799439012',
    });
    expect(parsed.success).toBe(true);
  });

  it('generates normalized verification codes', () => {
    const code = generateVerificationCode();
    expect(code.startsWith('LN-')).toBe(true);
    expect(normalizeVerificationCode(' ln-abc123 ')).toBe('LN-ABC123');
  });
});
