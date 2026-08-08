'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { useStudentCertificateDashboard } from '@/features/certificate';

export default function StudentCertificatesPage() {
  const t = useTranslations('dashboard.student.certificates');
  const dashQuery = useStudentCertificateDashboard();
  const dash = dashQuery.data;
  const rows = dash?.recentCertificates ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.CERTIFICATE_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {dashQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => dashQuery.refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {dashQuery.isLoading ? (
              <>
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </>
            ) : (
              <>
                <Card className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardDescription>{t('stats.certificates')}</CardDescription>
                    <CardTitle className="text-2xl">{dash?.certificateCount ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-border/80">
                  <CardHeader>
                    <CardDescription>{t('stats.transcripts')}</CardDescription>
                    <CardTitle className="text-2xl">{dash?.transcriptCount ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
        )}

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4" />
              {t('listTitle')}
            </CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>
          {dashQuery.isLoading ? (
            <div className="space-y-3 px-6 pb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
            </div>
          ) : (
            <div className="divide-y divide-border px-6 pb-6">
              {rows.map((row) => (
                <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{String(row.title ?? 'Certificate')}</p>
                    <p className="text-xs text-muted-foreground">{String(row.verificationCode)}</p>
                  </div>
                  <Badge>{String(row.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
