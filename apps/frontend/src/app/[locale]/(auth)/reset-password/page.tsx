'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  CardContent,
  CardFooter,
  Spinner,
} from '@learnova/ui';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
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
import { ApiClientError } from '@/lib/api/client';
import { Link, useRouter } from '@/lib/i18n/routing';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
  useResetPasswordMutation,
} from '@/features/auth';

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const tForgot = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      setSuccessMessage(null);
      try {
        const result = await mutation.mutateAsync({
          token: values.token.length > 0 ? values.token : tokenFromUrl,
          password: values.password,
        });
        setSuccessMessage(result.message);
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : tCommon('error');
        setError('root', { message });
      }
    })(event);
  };

  if (!tokenFromUrl) {
    return (
      <AuthCardShell icon={LockKeyhole} title={tCommon('error')} description={t('description')}>
        <CardFooter className={authFooterClassName}>
          <AuthButtonMotion>
            <Button asChild className={authPrimaryButtonClassName}>
              <Link href="/forgot-password">{tForgot('sendButton')}</Link>
            </Button>
          </AuthButtonMotion>
          <Link
            href="/login"
            className="group/back inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
            {tForgot('backToSignIn')}
          </Link>
        </CardFooter>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell icon={LockKeyhole} title={t('title')} description={t('description')}>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className={authContentClassName}>
          <input type="hidden" {...register('token')} />

          {errors.root?.message ? (
            <AuthAlert variant="error">{errors.root.message}</AuthAlert>
          ) : null}
          {successMessage ? (
            <AuthAlert variant="success">{successMessage}</AuthAlert>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t('newPassword')}
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              disabled={mutation.isPending}
              className={authInputClassName}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-danger">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t('confirmPassword')}
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              disabled={mutation.isPending}
              className={authInputClassName}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className={authFooterClassName}>
          <AuthButtonMotion pending={mutation.isPending}>
            <Button
              type="submit"
              className={authPrimaryButtonClassName}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {t('resetting')}
                </>
              ) : (
                t('resetButton')
              )}
            </Button>
          </AuthButtonMotion>
          <Link
            href="/login"
            className="group/back inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
            {tForgot('backToSignIn')}
          </Link>
        </CardFooter>
      </form>
    </AuthCardShell>
  );
}

function ResetFallback() {
  return (
    <AuthCardShell icon={LockKeyhole} title="…" description="">
      <CardContent className="flex min-h-[200px] items-center justify-center py-10">
        <Spinner size="lg" />
      </CardContent>
    </AuthCardShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
