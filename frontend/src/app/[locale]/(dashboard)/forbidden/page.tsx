'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@learnova/ui';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

function ForbiddenContent() {
  const t = useTranslations('dashboard.forbidden');
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { user } = useAuth();
  const home = user ? dashboardPathForRole(user.role) : '/login';

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-soft-md">
        <CardHeader className="text-center">
          <p className="text-5xl font-semibold text-primary">403</p>
          <CardTitle className="pt-2">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {from ? (
            <p className="text-xs text-muted-foreground">
              {t('attempted')}: <code className="rounded bg-muted px-1">{from}</code>
            </p>
          ) : null}
          <Button asChild>
            <Link href={home}>{t('backHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ForbiddenContent />
    </Suspense>
  );
}
