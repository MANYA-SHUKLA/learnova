'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  CardContent,
  CardFooter,
  Input,
  Spinner,
} from '@learnova/ui';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
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
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  useForgotPasswordMutation,
} from '@/features/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
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

  const emailRegister = register('email');
  const { ref: emailRef, onChange: onEmailChange, onBlur: onEmailBlur, name: emailName } =
    emailRegister;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      setSuccessMessage(null);
      try {
        const result = await mutation.mutateAsync(values);
        setSuccessMessage(result.message);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : t('errorMessage');
        setError('root', { message });
      }
    })(event);
  };

  return (
    <AuthCardShell icon={KeyRound} title={t('title')} description={t('description')}>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className={authContentClassName}>
          {errors.root?.message ? (
            <AuthAlert variant="error">{errors.root.message}</AuthAlert>
          ) : null}
          {successMessage ? (
            <AuthAlert variant="success">{successMessage}</AuthAlert>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('email')}
            </label>
            <div
              className={cn(
                'relative rounded-xl transition-shadow duration-300',
                focused && 'shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]',
              )}
            >
              <Mail
                className={cn(
                  'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200',
                  focused ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                disabled={mutation.isPending}
                className={cn(authInputClassName, 'pl-10')}
                name={emailName}
                ref={emailRef}
                onChange={onEmailChange}
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                  setFocused(false);
                  void onEmailBlur(e);
                }}
              />
            </div>
            {errors.email ? (
              <p className="text-xs text-danger">{errors.email.message}</p>
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
                  {t('sending')}
                </>
              ) : (
                t('sendButton')
              )}
            </Button>
          </AuthButtonMotion>

          <Link
            href="/login"
            className="group/back inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover/back:-translate-x-1" />
            {t('backToSignIn')}
          </Link>
        </CardFooter>
      </form>
    </AuthCardShell>
  );
}
