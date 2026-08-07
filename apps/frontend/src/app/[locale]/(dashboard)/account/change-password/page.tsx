'use client';

import {
  Button,
  CardContent,
  CardFooter,
  Spinner,
} from '@learnova/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  AuthAlert,
  AuthButtonMotion,
  AuthCardShell,
  authContentClassName,
  authFooterClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/shared/auth-card-shell';
import { PasswordInput } from '@/components/shared/password-input';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
  useChangePasswordMutation,
} from '@/features/auth';
import { ApiClientError } from '@/lib/api/client';
import { resolvePostLoginPath } from '@/lib/auth/redirects';
import { useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function ChangePasswordPage() {
  const t = useTranslations('auth.changePassword');
  const router = useRouter();
  const { user } = useAuth();
  const changeMutation = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      try {
        await changeMutation.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        const destination = await resolvePostLoginPath(user?.role);
        router.replace(destination);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : t('errorMessage');
        setError('root', { message });
      }
    })(event);
  };

  return (
    <AuthCardShell icon={ShieldCheck} title={t('title')} description={t('description')}>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className={authContentClassName}>
          {errors.root?.message ? (
            <AuthAlert variant="error">{errors.root.message}</AuthAlert>
          ) : null}

          <p className="text-sm font-medium text-foreground">{t('cardTitle')}</p>
          <p className="-mt-2 text-xs text-muted-foreground">{t('cardDescription')}</p>

          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium">
              {t('currentPassword')}
            </label>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              disabled={changeMutation.isPending}
              className={authInputClassName}
              {...register('currentPassword')}
            />
            {errors.currentPassword ? (
              <p className="text-xs text-danger">{errors.currentPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              {t('newPassword')}
            </label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              disabled={changeMutation.isPending}
              className={authInputClassName}
              {...register('newPassword')}
            />
            {errors.newPassword ? (
              <p className="text-xs text-danger">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t('confirmPassword')}
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              disabled={changeMutation.isPending}
              className={authInputClassName}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className={authFooterClassName}>
          <AuthButtonMotion pending={changeMutation.isPending}>
            <Button
              type="submit"
              className={authPrimaryButtonClassName}
              disabled={changeMutation.isPending}
            >
              {changeMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {t('saving')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </AuthButtonMotion>
          <p className="text-center text-xs text-muted-foreground">{t('cannotSkip')}</p>
        </CardFooter>
      </form>
    </AuthCardShell>
  );
}
