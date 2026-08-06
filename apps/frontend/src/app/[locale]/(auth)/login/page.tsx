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
import { useSearchParams } from 'next/navigation';
import { Suspense, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  loginSchema,
  type LoginFormValues,
  useLoginMutation,
} from '@/features/auth';
import { ApiClientError } from '@/lib/api/client';
import { resolvePostLoginPath } from '@/lib/auth/redirects';
import { isSaasModeEnabled } from '@/lib/saas';
import { Link, useRouter } from '@/lib/i18n/routing';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const registered = searchParams.get('registered') === '1';
  const loginMutation = useLoginMutation();
  const saasMode = isSaasModeEnabled();

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
        const destination = await resolvePostLoginPath(session.user.role, nextPath);
        router.replace(destination);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : 'Unable to sign in. Try again.';
        setError('root', { message });
      }
    })(event);
  };

  return (
    <Card className="w-full border-border/80 shadow-soft-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg">Institution login</CardTitle>
        <CardDescription>
          Sign in with the credentials issued by your institution.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {registered ? (
            <p
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            >
              Institution registered. Verify your email, then sign in to finish institution setup.
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
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="shuklamanya99@gmail.com"
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
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
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
            Remember me
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Signing in…
              </>
            ) : (
              'Login'
            )}
          </Button>

          <div className="w-full space-y-3 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            <p>
              Need an account?{' '}
              <span className="font-medium text-foreground">
                Contact your Institution Administrator
              </span>
            </p>
            {saasMode ? (
              <p>
                Setting up a campus?{' '}
                <Link
                  href="/register-institution"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Register Institution
                </Link>
              </p>
            ) : null}
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
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Learnova
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Learn. Build. Excel. — Institution workspace access.
        </p>
      </div>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
