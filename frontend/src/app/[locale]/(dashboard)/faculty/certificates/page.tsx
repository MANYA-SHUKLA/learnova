'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect } from '@/components/shared/entity-selects';
import {
  CertificateListCard,
  CertificateListRow,
  CertificatePageHeader,
  useCertificateList,
  useEligibleStudentsQuery,
  useIssueCertificateMutation,
} from '@/features/certificate';

export default function FacultyCertificatesPage() {
  const t = useTranslations('dashboard.faculty.certificates');
  const [courseId, setCourseId] = useState('');
  const listQuery = useCertificateList({ page: '1', limit: '25' });
  const eligibleQuery = useEligibleStudentsQuery(courseId, Boolean(courseId));
  const issueMutation = useIssueCertificateMutation();

  const rows = listQuery.data?.items ?? [];
  const eligible = eligibleQuery.data?.items ?? [];

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
            <CourseSelect className="mt-3 max-w-md" value={courseId} onChange={setCourseId} />
            {eligibleQuery.isLoading ? (
              <Skeleton className="mt-4 h-16 rounded-xl" />
            ) : (
              <div className="mt-4 space-y-2">
                {!courseId ? (
                  <p className="text-sm text-muted-foreground">{t('eligibleHint')}</p>
                ) : eligible.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('eligibleEmpty')}</p>
                ) : (
                  eligible.map((student) => (
                    <div
                      key={student.studentId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"
                    >
                      <span>
                        {student.fullName ?? student.studentId}
                        {student.rollNumber ? ` · ${student.rollNumber}` : ''}
                      </span>
                      <Button
                        size="sm"
                        disabled={issueMutation.isPending}
                        onClick={() => {
                          void issueMutation.mutateAsync({
                            studentId: student.studentId,
                            courseId,
                            documentType: 'course_completion',
                            publish: true,
                          });
                        }}
                      >
                        {t('issue')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
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
              key={row.id}
              primary={row.title ?? 'Certificate'}
              secondary={row.certificateNumber ?? row.id}
              status={row.status ?? 'issued'}
            />
          ))}
        </CertificateListCard>
      </div>
    </PermissionGate>
  );
}
