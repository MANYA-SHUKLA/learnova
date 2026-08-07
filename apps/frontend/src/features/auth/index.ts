/**
 * Auth feature barrel.
 */

export { authApi } from './services/auth-api';
export { useAuthStore } from './stores/auth-store';
export {
  authKeys,
  useCurrentUser,
  useSessions,
  useLoginMutation,
  useRegisterInstitutionMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useRevokeSessionMutation,
  useRefreshMutation,
} from './hooks/use-auth-queries';
export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  registerInstitutionFormSchema,
  type LoginFormValues,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
  type ChangePasswordFormValues,
  type VerifyEmailFormValues,
  type RegisterInstitutionFormValues,
} from './schemas';
export type {
  AuthSessionResponse,
  MessageResponse,
  MeResponse,
  CurrentSessionResponse,
  SessionsListResponse,
} from './types';
