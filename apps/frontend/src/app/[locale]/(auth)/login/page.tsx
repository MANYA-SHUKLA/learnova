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
  Input,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { PasswordInput } from '@/components/shared/password-input';
import {
  loginSchema,
  type LoginFormValues,
  useLoginMutation,
} from '@/features/auth';
import { ApiClientError } from '@/lib/api/client';
import { resolvePostLoginPath } from '@/lib/auth/redirects';
import { Link, useRouter } from '@/lib/i18n/routing';
import { APP_ROUTES } from '@learnova/constants';

function LoginForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const registered = searchParams.get('registered') === '1';
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      try {
        const session = await loginMutation.mutateAsync({
          email: values.email,
          password: values.password,
        });
        if (session.user.mustChangePassword) {
          router.replace(APP_ROUTES.CHANGE_PASSWORD);
          return;
        }
        const destination = await resolvePostLoginPath(session.user.role, nextPath);
        router.replace(destination);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : t('errorMessage');
        setError('root', { message });
      }
    })(event);
  };

  return (
    <Card className="w-full border-border/80 shadow-soft-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {registered ? (
            <p
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            >
              {t('registeredMessage')}
            </p>
          ) : null}
          {errors.root?.message ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {errors.root.message}
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('email')}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              disabled={loginMutation.isPending}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-xs text-danger">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              disabled={loginMutation.isPending}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-danger">{errors.password.message}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              disabled={loginMutation.isPending}
              {...register('rememberMe')}
            />
            {t('rememberMe')}
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Spinner size="sm" />
                {t('signingIn')}
              </>
            ) : (
              t('loginButton')
            )}
          </Button>

          <div className="w-full space-y-3 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            <p>
              {t('needAccountLabel')}{' '}
              <span className="font-medium text-foreground">{t('needAccountText')}</span>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex min-h-[240px] items-center justify-center pt-6">
        <Spinner size="lg" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth.login');

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          {t('brand')}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('welcomeBack')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('tagline')}</p>
      </div>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
