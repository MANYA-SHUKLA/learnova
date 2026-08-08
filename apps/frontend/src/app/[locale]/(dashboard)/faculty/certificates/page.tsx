'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Input, Skeleton } from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  CertificateListCard,
  CertificateListRow,
  CertificatePageHeader,
  useCertificateList,
} from '@/features/certificate';
import { certificateApi } from '@/features/certificate/services/certificate-api';
import { useQuery } from '@tanstack/react-query';

export default function FacultyCertificatesPage() {
  const t = useTranslations('dashboard.faculty.certificates');
  const [courseId, setCourseId] = useState('');
  const listQuery = useCertificateList({ page: '1', limit: '25' });
  const eligibleQuery = useQuery({
    queryKey: ['certificates', 'eligible', courseId],
    queryFn: () => certificateApi.listEligibleStudents(courseId),
    enabled: courseId.length === 24,
  });

  const rows = listQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.CERTIFICATE_WRITE} enforce>
      <div className="space-y-8">
        <CertificatePageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('eligibleTitle')}</CardTitle>
            <CardDescription>{t('eligibleDescription')}</CardDescription>
            <Input
              className="mt-3 max-w-md"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder={t('courseIdPlaceholder')}
            />
            {eligibleQuery.isLoading ? (
              <Skeleton className="mt-4 h-16 rounded-xl" />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {courseId.length === 24
                  ? t('eligibleCount', { count: eligibleQuery.data?.total ?? 0 })
                  : t('eligibleHint')}
              </p>
            )}
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
              key={String(row.id)}
              primary={String(row.title ?? 'Certificate')}
              secondary={String(row.certificateNumber ?? row.id)}
              status={String(row.status)}
            />
          ))}
        </CertificateListCard>
      </div>
    </PermissionGate>
  );
}
