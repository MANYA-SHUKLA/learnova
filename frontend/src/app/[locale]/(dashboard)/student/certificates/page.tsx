'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  CertificateListCard,
  CertificateListRow,
  CertificatePageHeader,
  CertificateStatCard,
  CertificateStatGrid,
  openCertificateForPrint,
  useStudentCertificateDashboard,
} from '@/features/certificate';

export default function StudentCertificatesPage() {
  const t = useTranslations('dashboard.student.certificates');
  const dashQuery = useStudentCertificateDashboard();
  const dash = dashQuery.data;
  const rows = dash?.recentCertificates ?? [];

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
          <CertificateStatGrid loading={dashQuery.isLoading} columns={2}>
            <CertificateStatCard label={t('stats.certificates')} value={dash?.certificateCount ?? 0} />
            <CertificateStatCard label={t('stats.transcripts')} value={dash?.transcriptCount ?? 0} />
          </CertificateStatGrid>
        )}

        <CertificateListCard
          title={t('listTitle')}
          description={t('listDescription')}
          icon={<Award className="size-4 text-primary" />}
          isLoading={dashQuery.isLoading}
          emptyTitle={rows.length === 0 && !dashQuery.isLoading ? t('emptyTitle') : undefined}
          emptyDescription={t('emptyDescription')}
        >
          {rows.map((row) => (
            <CertificateListRow
              key={row.id}
              primary={row.title ?? 'Certificate'}
              secondary={row.certificateNumber ?? row.verificationCode}
              status={row.status ?? 'issued'}
              actions={
                row.status !== 'revoked' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void openCertificateForPrint(row.id);
                      }}
                    >
                      {t('download')}
                    </Button>
                    {row.verificationCode ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/verify/${row.verificationCode}`} target="_blank">
                          {t('verify')}
                        </Link>
                      </Button>
                    ) : null}
                  </>
                ) : null
              }
            />
          ))}
        </CertificateListCard>
      </div>
    </PermissionGate>
  );
}
