import { describe, expect, it } from 'vitest';
import {
  issueCertificateSchema,
  revokeCertificateSchema,
  verifyCertificateQuerySchema,
} from '@learnova/validation';
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

  it('validates revoke certificate payload', () => {
    const parsed = revokeCertificateSchema.parse({
      certificateId: '507f1f77bcf86cd799439011',
      reason: 'Grade appeal upheld',
    });
    expect(parsed.reason).toBe('Grade appeal upheld');
  });

  it('validates verify query', () => {
    const parsed = verifyCertificateQuerySchema.parse({ code: 'LN-ABC12345' });
    expect(parsed.code).toBe('LN-ABC12345');
  });

  it('generates normalized verification codes', () => {
    const code = generateVerificationCode();
    expect(code.startsWith('LN-')).toBe(true);
    expect(normalizeVerificationCode(' ln-abc123 ')).toBe('LN-ABC123');
  });
});

describe('certificate permissions', () => {
  it('faculty can write but not manage certificates', async () => {
    const { ROLE_PERMISSIONS } = await import('@learnova/shared');
    expect(ROLE_PERMISSIONS.faculty).toContain('certificate:write');
    expect(ROLE_PERMISSIONS.faculty).not.toContain('certificate:manage');
  });

  it('only institution admin can revoke (manage)', async () => {
    const { ROLE_PERMISSIONS } = await import('@learnova/shared');
    expect(ROLE_PERMISSIONS.institution_admin).toContain('certificate:manage');
    expect(ROLE_PERMISSIONS.student).not.toContain('certificate:manage');
  });
});
