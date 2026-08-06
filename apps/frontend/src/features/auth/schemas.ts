/**
 * Minimal auth form schemas (local — @learnova/validation is not a frontend dep).
 */

import { z } from 'zod';

const emailField = z.string().email('Enter a valid email').toLowerCase().trim();

const passwordStrong = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,128}$/,
    'Password must include uppercase, lowercase, number, and special character',
  );

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(128),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Invalid reset token'),
  password: passwordStrong,
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword: passwordStrong,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20, 'Invalid verification token'),
});

/** UI schema for institution onboarding — API accepts a subset. */
export const registerInstitutionFormSchema = z
  .object({
    institutionName: z.string().trim().min(2, 'Institution name is required').max(200),
    institutionCode: z.string().trim().min(2, 'Institution code is required').max(32),
    institutionEmail: emailField,
    adminFirstName: z.string().trim().min(1, 'First name is required').max(80),
    adminLastName: z.string().trim().min(1, 'Last name is required').max(80),
    adminEmail: emailField,
    phone: z.string().trim().min(7, 'Enter a valid phone').max(32),
    country: z.string().trim().min(2, 'Country is required').max(80),
    timezone: z.string().trim().min(2, 'Timezone is required').max(80),
    password: passwordStrong,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z
      .boolean()
      .refine((value) => value === true, { message: 'You must accept the Terms to continue' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type RegisterInstitutionFormValues = z.infer<typeof registerInstitutionFormSchema>;
