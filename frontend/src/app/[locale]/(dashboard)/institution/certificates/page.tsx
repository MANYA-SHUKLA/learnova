'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect } from '@/components/shared/entity-selects';
import { ErrorState } from '@/features/institution';
import {
  CertificateListCard,
  CertificateListRow,
  CertificatePageHeader,
  CertificateStatCard,
  CertificateStatGrid,
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
        <CertificatePageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        {dashQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => dashQuery.refetch()} />
        ) : (
          <CertificateStatGrid loading={dashQuery.isLoading}>
            <CertificateStatCard label={t('stats.issued')} value={dash?.issuedCount ?? 0} />
            <CertificateStatCard label={t('stats.transcripts')} value={dash?.transcriptCount ?? 0} />
            <CertificateStatCard label={t('stats.eligible')} value={dash?.pendingEligible ?? 0} />
            <CertificateStatCard label={t('stats.revoked')} value={dash?.revokedCount ?? 0} />
          </CertificateStatGrid>
        )}

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('bulkTitle')}</CardTitle>
              <CardDescription>{t('bulkDescription')}</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <CourseSelect
                className="sm:w-80"
                value={courseId}
                onChange={setCourseId}
              />
              <Button
                className="sm:mb-0.5"
                disabled={!courseId || bulkMutation.isPending}
                onClick={() => { bulkMutation.mutate(courseId); }}
              >
                {t('bulkIssue')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <CertificateListCard
          title={t('listTitle')}
          description={t('listDescription')}
          icon={<Award className="size-4 text-primary" />}
          isLoading={listQuery.isLoading}
          isError={listQuery.isError}
          errorMessage={t('error')}
          onRetry={() => listQuery.refetch()}
          emptyTitle={rows.length === 0 && !listQuery.isLoading ? t('emptyTitle') : undefined}
          emptyDescription={t('emptyDescription')}
        >
          {rows.map((row) => (
            <CertificateListRow
              key={String(row['id'])}
              primary={String(row['title'] ?? 'Certificate')}
              secondary={`${String(row['documentType'])} · ${String(row['certificateNumber'] ?? row['verificationCode'])}`}
              status={String(row['status'])}
            />
          ))}
        </CertificateListCard>
      </div>
    </PermissionGate>
  );
}
