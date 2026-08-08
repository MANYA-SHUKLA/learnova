import { randomBytes } from 'node:crypto';
import { CERTIFICATE_DEFAULTS } from '@learnova/constants';

export function generateVerificationCode(prefix = CERTIFICATE_DEFAULTS.VERIFICATION_PREFIX): string {
  const token = randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${token}`;
}

export function normalizeVerificationCode(code: string): string {
  return code.trim().toUpperCase();
}
