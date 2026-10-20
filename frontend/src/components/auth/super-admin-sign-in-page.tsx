'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { APP_ROUTES } from '@learnova/constants';
import { Button, CardContent, Input, Spinner } from '@learnova/ui';
import { Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  AuthAlert,
  AuthCardShell,
  authContentClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/shared/auth-card-shell';
import { PasswordInput } from '@/components/shared/password-input';
import { loginSchema, type LoginFormValues } from '@/features/auth';
import { authApi } from '@/features/auth/services/auth-api';
import { ApiClientError } from '@/lib/api/client';
import { storeAccessToken } from '@/lib/auth/jwt';
import { useRouter } from '@/lib/i18n/routing';
import { useAuthStore } from '@/features/auth/stores/auth-store';

/** Super-admin sign-in — direct URL only (`/superadmin/login`), not linked from marketing footer. */
export function SuperAdminSignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  return (
    <AuthCardShell brand="company" icon={Shield} title="Super admin">
      <form
        onSubmit={(e) => {
          void handleSubmit(async (values) => {
            try {
              const data = await authApi.loginSuperAdmin({
                email: values.email,
                password: values.password,
              });
              storeAccessToken(data.accessToken);
              setAuth({
                user: data.user,
                accessToken: data.accessToken,
                session: data.session,
                roleHint: data.roleHint,
              });
              router.replace(APP_ROUTES.CONSOLE);
            } catch (err) {
              setError('root', {
                message: err instanceof ApiClientError ? err.message : 'Sign in failed',
              });
            }
          })(e);
        }}
      >
        <CardContent className={authContentClassName}>
          {errors.root?.message ? <AuthAlert variant="error">{errors.root.message}</AuthAlert> : null}
          <Input className={authInputClassName} placeholder="Email" {...register('email')} />
          <PasswordInput className={authInputClassName} {...register('password')} />
          <Button type="submit" className={authPrimaryButtonClassName} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Sign in'}
          </Button>
        </CardContent>
      </form>
    </AuthCardShell>
  );
}
