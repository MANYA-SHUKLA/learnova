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
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  useForgotPasswordMutation,
} from '@/features/auth';

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      setSuccessMessage(null);
      try {
        const result = await mutation.mutateAsync(values);
        setSuccessMessage(result.message);
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Unable to send reset link. Try again.';
        setError('root', { message });
      }
    })(event);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send a reset link if an account exists.
          </CardDescription>
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
            {successMessage ? (
              <p
                role="status"
                className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
              >
                {successMessage}
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
                disabled={mutation.isPending}
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-danger">{errors.email.message}</p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  Sending…
                </>
              ) : (
                'Send reset link'
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
    </main>
  );
}
