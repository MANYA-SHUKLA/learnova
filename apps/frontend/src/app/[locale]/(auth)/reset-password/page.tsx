'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{tCommon('error')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/forgot-password">{tForgot('sendButton')}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <input type="hidden" {...register('token')} />

          {errors.root?.message ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {errors.root.message}
            </p>
          ) : null}
          {successMessage ? (
            <p
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            >
              {successMessage}
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t('newPassword')}
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              disabled={mutation.isPending}
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
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Spinner size="sm" />
                {t('resetting')}
              </>
            ) : (
              t('resetButton')
            )}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {tForgot('backToSignIn')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

function ResetFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex min-h-[240px] items-center justify-center pt-6">
        <Spinner size="lg" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full min-w-0">
      <Suspense fallback={<ResetFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
