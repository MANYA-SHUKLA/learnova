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
import { Suspense, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { ApiClientError } from '@/lib/api/client';
import { Link, useRouter } from '@/lib/i18n/routing';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
  useResetPasswordMutation,
} from '@/features/auth';

function ResetPasswordForm() {
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
          err instanceof ApiClientError
            ? err.message
            : 'Unable to reset password. Try again.';
        setError('root', { message });
      }
    })(event);
  };

  if (!tokenFromUrl) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is missing a token. Request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request reset link</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
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
              New password
            </label>
            <Input
              id="password"
              type="password"
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
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
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
                Updating…
              </>
            ) : (
              'Reset password'
            )}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
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
