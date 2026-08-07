'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  CardContent,
  CardFooter,
  Input,
  Spinner,
} from '@learnova/ui';
import { Building2 } from 'lucide-react';
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
  registerInstitutionFormSchema,
  type RegisterInstitutionFormValues,
  useRegisterInstitutionMutation,
} from '@/features/auth';
import { ApiClientError } from '@/lib/api/client';
import { resolvePostLoginPath } from '@/lib/auth/redirects';
import { Link, useRouter } from '@/lib/i18n/routing';

export default function RegisterInstitutionPage() {
  const t = useTranslations('auth.registerInstitution');
  const router = useRouter();
  const registerMutation = useRegisterInstitutionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInstitutionFormValues>({
    resolver: zodResolver(registerInstitutionFormSchema),
    defaultValues: {
      institutionName: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      try {
        const session = await registerMutation.mutateAsync({
          institutionName: values.institutionName,
          email: values.adminEmail,
          password: values.password,
          firstName: values.adminFirstName,
          lastName: values.adminLastName,
        });
        const destination = await resolvePostLoginPath(session.user.role);
        router.replace(destination);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : t('errorMessage');
        setError('root', { message });
      }
    })(event);
  };

  const field = (
    name: keyof RegisterInstitutionFormValues,
    label: string,
    opts?: { type?: string; autoComplete?: string; placeholder?: string },
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        type={opts?.type ?? 'text'}
        autoComplete={opts?.autoComplete}
        placeholder={opts?.placeholder}
        disabled={registerMutation.isPending}
        className={authInputClassName}
        {...register(name)}
      />
      {errors[name] ? (
        <p className="text-xs text-danger">{String(errors[name]?.message ?? '')}</p>
      ) : null}
    </div>
  );

  return (
    <AuthCardShell
      icon={Building2}
      title={t('title')}
      description={t('subtitle')}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={onSubmit} noValidate>
        <CardContent className={authContentClassName}>
          {errors.root?.message ? (
            <AuthAlert variant="error">{errors.root.message}</AuthAlert>
          ) : null}

          <p className="text-sm font-medium text-foreground">{t('cardTitle')}</p>
          <p className="-mt-2 text-xs text-muted-foreground">{t('cardDescription')}</p>

          {field('institutionName', t('institutionName'), {
            placeholder: t('institutionNamePlaceholder'),
          })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('adminFirstName', t('adminFirstName'), {
              autoComplete: 'given-name',
              placeholder: t('adminFirstNamePlaceholder'),
            })}
            {field('adminLastName', t('adminLastName'), {
              autoComplete: 'family-name',
              placeholder: t('adminLastNamePlaceholder'),
            })}
          </div>
          {field('adminEmail', t('adminEmail'), {
            type: 'email',
            autoComplete: 'email',
            placeholder: t('adminEmailPlaceholder'),
          })}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t('password')}
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              disabled={registerMutation.isPending}
              className={authInputClassName}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-danger">{errors.password.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t('confirmPassword')}
            </label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              disabled={registerMutation.isPending}
              className={authInputClassName}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t('passwordRequirement')}</p>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input"
              disabled={registerMutation.isPending}
              {...register('acceptTerms')}
            />
            <span>
              {t('acceptTermsLabel')}{' '}
              <Link
                href="/terms"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {t('terms')}
              </Link>{' '}
              {t('and')}{' '}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {t('privacyPolicy')}
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms ? (
            <p className="text-xs text-danger">{errors.acceptTerms.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className={authFooterClassName}>
          <AuthButtonMotion pending={registerMutation.isPending}>
            <Button
              type="submit"
              className={authPrimaryButtonClassName}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {t('creatingAccount')}
                </>
              ) : (
                t('continueButton')
              )}
            </Button>
          </AuthButtonMotion>
          <p className="text-center text-sm text-muted-foreground">
            {t('alreadyRegistered')}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t('institutionLogin')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthCardShell>
  );
}
