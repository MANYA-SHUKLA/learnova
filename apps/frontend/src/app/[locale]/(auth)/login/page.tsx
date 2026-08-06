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
import { ApiClientError } from '@/lib/api/client';
import { Link, useRouter } from '@/lib/i18n/routing';
import {
  loginSchema,
  type LoginFormValues,
  useLoginMutation,
} from '@/features/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/dashboard';
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      try {
        await loginMutation.mutateAsync(values);
        router.replace(nextPath);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : 'Unable to sign in. Try again.';
        setError('root', { message });
      }
    })(event);
  };

  return (
    <Card className="w-full border-border/80 shadow-glow">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>Use your institution admin or faculty credentials.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
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
              placeholder="you@institution.edu"
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
                className="text-xs text-muted-foreground hover:text-foreground"
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
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Spinner size="sm" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
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
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your institution workspace.
        </p>
      </div>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
