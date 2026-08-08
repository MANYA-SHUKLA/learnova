'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  CertificateListCard,
  CertificateListRow,
  CertificatePageHeader,
} from '@/features/certificate';
import { certificateApi } from '@/features/certificate/services/certificate-api';

export default function StudentTranscriptPage() {
  const t = useTranslations('dashboard.student.transcript');
  const transcriptsQuery = useQuery({
    queryKey: ['certificates', 'transcripts'],
    queryFn: () => certificateApi.listTranscripts(),
  });
  const recordQuery = useQuery({
    queryKey: ['certificates', 'academic-record'],
    queryFn: () => certificateApi.getAcademicRecord(),
  });

  const transcripts = transcriptsQuery.data?.items ?? [];
  const record = recordQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.CERTIFICATE_READ} enforce>
      <div className="space-y-8">
        <CertificatePageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('recordTitle')}</CardTitle>
            {recordQuery.isLoading ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : recordQuery.isError ? (
              <CardDescription>{t('recordEmpty')}</CardDescription>
            ) : (
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">{t('semesterGpa')}</dt>
                  <dd className="font-medium">{String(record?.semesterGpa ?? '—')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('cgpa')}</dt>
                  <dd className="font-medium">{String(record?.cgpa ?? '—')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('standing')}</dt>
                  <dd className="font-medium">{String(record?.academicStanding ?? '—')}</dd>
                </div>
              </dl>
            )}
          </CardHeader>
        </Card>

        <CertificateListCard
          title={t('listTitle')}
          description={t('listDescription')}
          icon={<FileText className="size-4 text-primary" />}
          isLoading={transcriptsQuery.isLoading}
          isError={transcriptsQuery.isError}
          errorMessage={t('error')}
          onRetry={() => transcriptsQuery.refetch()}
          emptyTitle={transcripts.length === 0 && !transcriptsQuery.isLoading ? t('emptyTitle') : undefined}
          emptyDescription={t('emptyDescription')}
        >
          {transcripts.map((row) => (
            <CertificateListRow
              key={String(row.id)}
              primary={String(row.transcriptNumber ?? row.id)}
              secondary={String(row.transcriptType ?? 'official')}
              status={String(row.status)}
            />
          ))}
        </CertificateListCard>
      </div>
    </PermissionGate>
  );
}
