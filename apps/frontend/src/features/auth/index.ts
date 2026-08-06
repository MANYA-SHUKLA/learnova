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
  useLogoutMutation,
  useLogoutAllMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
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
  type LoginFormValues,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
  type ChangePasswordFormValues,
  type VerifyEmailFormValues,
} from './schemas';
export type {
  AuthSessionResponse,
  MessageResponse,
  MeResponse,
  CurrentSessionResponse,
  SessionsListResponse,
} from './types';
