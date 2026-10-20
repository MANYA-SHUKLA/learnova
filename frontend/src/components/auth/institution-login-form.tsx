'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  CardContent,
  CardFooter,
  Input,
  Spinner,
} from '@learnova/ui';
import { APP_ROUTES } from '@learnova/constants';
import type { PublicPortalPayload } from '@learnova/types';
import { LogIn, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/features/public/services/public-api';
import { useForm } from 'react-hook-form';
import {
  AuthButtonMotion,
  AuthCardShell,
  authContentClassName,
  authFooterClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/shared/auth-card-shell';
import { PasswordInput } from '@/components/shared/password-input';
import {
  loginSchema,
  type LoginFormValues,
  useLoginMutation,
} from '@/features/auth';
import { useAuthPageFeedback } from '@/components/auth/auth-page-feedback';
import { resolvePostLoginPath, dashboardPathForRole } from '@/lib/auth/redirects';
import { Link, useRouter } from '@/lib/i18n/routing';
import { InstitutionMark } from '@/components/institution/institution-mark';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

export type InstitutionLoginFormProps = {
  /** When set, sign-in is bound to this campus (path-based login). */
  campusSlug?: string;
  /** Server-fetched portal; skips client fetch when provided. */
  portal?: PublicPortalPayload | null;
};

function InstitutionLoginFormInner({
  campusSlug: campusSlugProp,
  portal: portalProp,
}: InstitutionLoginFormProps) {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const campusSlug = campusSlugProp ?? searchParams.get('campus') ?? undefined;
  const portalQuery = useQuery({
    queryKey: ['public', 'portal', campusSlug],
    queryFn: () => publicApi.getPortal(campusSlug!),
    enabled: Boolean(campusSlug) && !portalProp,
  });
  const loginMutation = useLoginMutation();
  const { showError, clear } = useAuthPageFeedback();
  const [emailFocused, setEmailFocused] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.role) return;
    if (user.role === 'super_admin') return;
    router.replace(dashboardPathForRole(user.role));
  }, [isAuthenticated, isLoading, router, user?.role]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const emailRegister = register('email');
  const { ref: emailRef, onChange: onEmailChange, onBlur: onEmailBlur, name: emailName } =
    emailRegister;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      clear();
      try {
        const session = await loginMutation.mutateAsync({
          email: values.email,
          password: values.password,
          campusSlug,
        });
        try {
          if (session.user.mustChangePassword) {
            router.replace(APP_ROUTES.CHANGE_PASSWORD);
            return;
          }
          const destination = await resolvePostLoginPath(session.user.role, nextPath);
          router.replace(destination);
        } catch {
          showError(t('errorMessage'));
        }
      } catch {
        showError(t('invalidCredentials'));
      }
    })(event);
  };

  const portal = portalProp ?? portalQuery.data;
  const loginTitle = portal?.portalSettings?.portalTitle || portal?.name || t('title');
  const loginSubtitle =
    portal?.portalSettings?.portalSubtitle ||
    (campusSlug
      ? t('campusSubtitle', { campus: portal?.shortName ?? campusSlug })
      : t('genericSubtitle'));

  const institutionBrand = portal ? (
    <InstitutionMark
      branding={{
        name: portal.name,
        shortName: portal.shortName ?? portal.name,
        logo: portal.logo,
        favicon: null,
      }}
      size="lg"
    />
  ) : null;

  return (
    <AuthCardShell
      brand={institutionBrand ? 'custom' : 'icon'}
      brandNode={institutionBrand ?? undefined}
      icon={LogIn}
      title={loginTitle}
    >
      <form onSubmit={onSubmit} noValidate>
        <CardContent className={authContentClassName}>
          {loginSubtitle ? (
            <p className="mb-4 text-center text-sm text-muted-foreground">{loginSubtitle}</p>
          ) : null}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('email')}
            </label>
            <div
              className={cn(
                'relative rounded-xl transition-shadow duration-300',
                emailFocused && 'shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]',
              )}
            >
              <Mail
                className={cn(
                  'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200',
                  emailFocused ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                disabled={loginMutation.isPending}
                className={cn(authInputClassName, 'pl-10')}
                name={emailName}
                ref={emailRef}
                onChange={onEmailChange}
                onFocus={() => { setEmailFocused(true); }}
                onBlur={(e) => {
                  setEmailFocused(false);
                  void onEmailBlur(e);
                }}
              />
            </div>
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
                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              disabled={loginMutation.isPending}
              className={authInputClassName}
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

        <CardFooter className={authFooterClassName}>
          <AuthButtonMotion pending={loginMutation.isPending}>
            <Button
              type="submit"
              className={authPrimaryButtonClassName}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {t('signingIn')}
                </>
              ) : (
                t('loginButton')
              )}
            </Button>
          </AuthButtonMotion>
        </CardFooter>
      </form>
    </AuthCardShell>
  );
}

function LoginFallback() {
  return (
    <AuthCardShell brand="icon" icon={LogIn} title="…" description="">
      <CardContent className="flex min-h-[200px] items-center justify-center py-10">
        <Spinner size="lg" />
      </CardContent>
    </AuthCardShell>
  );
}

export function InstitutionLoginForm(props: InstitutionLoginFormProps) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <InstitutionLoginFormInner {...props} />
    </Suspense>
  );
}
