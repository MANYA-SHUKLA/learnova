'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  useBulkIssueCertificatesMutation,
  useCertificateList,
  useInstitutionCertificateDashboard,
} from '@/features/certificate';

export default function InstitutionCertificatesPage() {
  const t = useTranslations('dashboard.institution.certificates');
  const [courseId, setCourseId] = useState('');
  const dashQuery = useInstitutionCertificateDashboard();
  const listQuery = useCertificateList({ page: '1', limit: '25' });
  const bulkMutation = useBulkIssueCertificatesMutation();

  const dash = dashQuery.data;
  const rows = listQuery.data?.items ?? [];

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
              : [
                  { label: t('stats.issued'), value: dash?.issuedCount ?? 0 },
                  { label: t('stats.transcripts'), value: dash?.transcriptCount ?? 0 },
                  { label: t('stats.eligible'), value: dash?.pendingEligible ?? 0 },
                  { label: t('stats.revoked'), value: dash?.revokedCount ?? 0 },
                ].map((stat) => (
                  <Card key={stat.label} className="rounded-2xl border-border/80">
                    <CardHeader>
                      <CardDescription>{stat.label}</CardDescription>
                      <CardTitle className="text-2xl">{stat.value}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
          </div>
        )}

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('bulkTitle')}</CardTitle>
              <CardDescription>{t('bulkDescription')}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                className="sm:w-72"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder={t('courseIdPlaceholder')}
              />
              <Button
                disabled={!courseId || bulkMutation.isPending}
                onClick={() => bulkMutation.mutate(courseId)}
              >
                {t('bulkIssue')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4" />
              {t('listTitle')}
            </CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>
          {listQuery.isError ? (
            <div className="px-6 pb-6">
              <ErrorState message={t('error')} onRetry={() => listQuery.refetch()} />
            </div>
          ) : listQuery.isLoading ? (
            <div className="space-y-3 px-6 pb-6">
              {Array.from({ length: 5 }).map((_, i) => (
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
                    <p className="text-xs text-muted-foreground">
                      {String(row.documentType)} · {String(row.verificationCode)}
                    </p>
                  </div>
                  <Badge variant={row.status === 'issued' ? 'default' : 'secondary'}>
                    {String(row.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
