'use client';

import { PERMISSIONS } from '@learnova/constants';
import { PageHeader, StatCard, StatGrid } from '@learnova/ui';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GradebookSpreadsheet } from '@/components/gradebook/gradebook-spreadsheet';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { formatPercentage, useGradebookList, useStudentGradebookDashboard } from '@/features/gradebook';

export default function StudentGradebookPage() {
  const t = useTranslations('dashboard.student.gradebook');
  const dashQuery = useStudentGradebookDashboard();
  const listQuery = useGradebookList({ page: 1, limit: 20 });
  const dash = dashQuery.data;
  const rows = listQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_READ} enforce>
      <div className="space-y-8">
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <StatGrid className="sm:grid-cols-3">
          <StatCard
            label={t('stats.courses')}
            value={dash?.courseCount ?? '—'}
            accent="primary"
            loading={dashQuery.isLoading}
          />
          <StatCard
            label={t('stats.finalized')}
            value={dash?.finalizedCourses ?? '—'}
            accent="accent"
            loading={dashQuery.isLoading}
          />
          <StatCard
            label={t('stats.average')}
            value={dash ? formatPercentage(dash.averagePercentage) : '—'}
            accent="success"
            loading={dashQuery.isLoading}
          />
        </StatGrid>

        <div>
          <div className="mb-4">
            <h2 className="text-section-title">{t('listTitle')}</h2>
            <p className="mt-1 text-caption">{t('listDescription')}</p>
          </div>

          {listQuery.isError ? (
            <ErrorState message={t('error')} onRetry={() => listQuery.refetch()} />
          ) : listQuery.isLoading ? (
            <GradebookSpreadsheet rows={[]} loading />
          ) : rows.length === 0 ? (
            <EmptyState icon={GraduationCap} title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : (
            <GradebookSpreadsheet rows={rows} />
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
