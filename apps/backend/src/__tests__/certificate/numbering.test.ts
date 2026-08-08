import { describe, expect, it } from 'vitest';
import { formatCertificateNumber, buildVerificationUrl } from '@learnova/shared';

describe('certificate numbering', () => {
  it('formats institution certificate numbers', () => {
    expect(formatCertificateNumber('LNV', 2026, 1)).toBe('LNV-2026-CERT-0000001');
    expect(formatCertificateNumber('JNU', 2026, 42, 'TRN')).toBe('JNU-2026-TRN-0000042');
  });

  it('builds public verification URLs', () => {
    expect(buildVerificationUrl('https://learnova.test', 'LN-ABC123')).toBe(
      'https://learnova.test/verify/LN-ABC123',
    );
  });
});
