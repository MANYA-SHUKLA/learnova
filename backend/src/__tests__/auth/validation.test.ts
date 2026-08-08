import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  loginSchema,
  passwordSchema,
  registerInstitutionSchema,
  resetPasswordSchema,
} from '@learnova/validation';

describe('auth validation schemas', () => {
  it('accepts a strong password', () => {
    const result = passwordSchema.safeParse('SecurePass1!xy');
    expect(result.success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = passwordSchema.safeParse('Short1!');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without complexity', () => {
    expect(passwordSchema.safeParse('alllowercase1!').success).toBe(false);
    expect(passwordSchema.safeParse('ALLUPPERCASE1!').success).toBe(false);
    expect(passwordSchema.safeParse('NoSpecialChar1').success).toBe(false);
  });

  it('rejects weak known passwords', () => {
    expect(passwordSchema.safeParse('Password123!').success).toBe(false);
  });

  it('validates login payload', () => {
    expect(
      loginSchema.safeParse({ email: 'admin@school.edu', password: 'x' }).success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
  });

  it('validates institution register payload', () => {
    const result = registerInstitutionSchema.safeParse({
      email: 'admin@school.edu',
      password: 'SecurePass1!xy',
      firstName: 'Ada',
      lastName: 'Lovelace',
      institutionName: 'Learnova Institute',
    });
    expect(result.success).toBe(true);
  });

  it('validates reset and change password payloads', () => {
    expect(
      resetPasswordSchema.safeParse({
        token: 'a'.repeat(32),
        password: 'SecurePass1!xy',
      }).success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'SecurePass1!xy',
      }).success,
    ).toBe(true);
  });
});
