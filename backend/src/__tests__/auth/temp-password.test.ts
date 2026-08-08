import { describe, expect, it } from 'vitest';
import { generateTemporaryPassword } from '../../security/temp-password.js';
import { passwordSchema } from '@learnova/validation';

describe('generateTemporaryPassword', () => {
  it('produces 12-char passwords that satisfy passwordSchema', () => {
    for (let i = 0; i < 20; i += 1) {
      const pwd = generateTemporaryPassword(12);
      expect(pwd).toHaveLength(12);
      expect(passwordSchema.safeParse(pwd).success).toBe(true);
    }
  });

  it('is not a fixed demo string', () => {
    const a = generateTemporaryPassword();
    expect(a).not.toBe('Learnova@ChangeMe1');
  });
});
