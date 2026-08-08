'use client';

import { Card, CardContent } from '@learnova/ui';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function ForbiddenPage() {
  const t = useTranslations('dashboard.forbidden');
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { user } = useAuth();
  const home = user ? dashboardPathForRole(user.role) : '/login';

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4">
      <Card className="max-w-lg rounded-2xl shadow-soft-md">
        <CardContent className="space-y-4 pt-8 text-center">
          <p className="text-5xl font-semibold text-destructive">403</p>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          {from ? (
            <p className="text-xs text-muted-foreground">
              {t('attempted')}: <code className="rounded bg-muted px-1">{from}</code>
            </p>
          ) : null}
          <Link
            href={home}
            className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t('backHome')}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
