import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const WEAK_PASSWORDS = new Set([
  'password123!',
  'Password123!',
  'Welcome123!',
  'Admin123456!',
  'Qwerty123456!',
  'Changeme123!',
  'Letmein1234!',
]);

const emailField = z.string().email().toLowerCase().trim();
const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(
    REGEX.PASSWORD_STRONG,
    'Password must include uppercase, lowercase, number, and special character',
  )
  .refine((value) => !WEAK_PASSWORDS.has(value), {
    message: 'Password is too common',
  });

export const registerInstitutionSchema = z.object({
  email: emailField,
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  institutionName: z.string().trim().min(2).max(200),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(256),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(256),
});

export const resendVerificationSchema = z.object({
  email: emailField,
});

export const sessionIdParamsSchema = z.object({
  id: objectIdField,
});

export type RegisterInstitutionInput = z.infer<typeof registerInstitutionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
