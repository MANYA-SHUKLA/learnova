'use client';

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
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { PasswordInput } from '@/components/shared/password-input';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
  useChangePasswordMutation,
} from '@/features/auth';
import { ApiClientError } from '@/lib/api/client';
import { resolvePostLoginPath } from '@/lib/auth/redirects';
import { useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function ChangePasswordPage() {
  const t = useTranslations('auth.changePassword');
  const router = useRouter();
  const { user } = useAuth();
  const changeMutation = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      try {
        await changeMutation.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        const destination = await resolvePostLoginPath(user?.role);
        router.replace(destination);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : t('errorMessage');
        setError('root', { message });
      }
    })(event);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
      <div className="mb-6 text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          {t('brand')}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <Card className="w-full border-border/80 shadow-soft-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg">{t('cardTitle')}</CardTitle>
          <CardDescription>{t('cardDescription')}</CardDescription>
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
              <label htmlFor="currentPassword" className="text-sm font-medium">
                {t('currentPassword')}
              </label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                disabled={changeMutation.isPending}
                {...register('currentPassword')}
              />
              {errors.currentPassword ? (
                <p className="text-xs text-danger">{errors.currentPassword.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                {t('newPassword')}
              </label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                disabled={changeMutation.isPending}
                {...register('newPassword')}
              />
              {errors.newPassword ? (
                <p className="text-xs text-danger">{errors.newPassword.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('confirmPassword')}
              </label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                disabled={changeMutation.isPending}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={changeMutation.isPending}>
              {changeMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {t('saving')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">{t('cannotSkip')}</p>
    </div>
  );
}
