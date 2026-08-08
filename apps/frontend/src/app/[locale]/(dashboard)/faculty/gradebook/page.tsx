'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Button,
  FormField,
  Input,
  PageHeader,
  StatCard,
  StatGrid,
  Skeleton,
} from '@learnova/ui';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { GradebookSpreadsheet } from '@/components/gradebook/gradebook-spreadsheet';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatPercentage,
  useCourseGradebookEntries,
  useFacultyGradebookDashboard,
  useSyncCourseGradebookMutation,
} from '@/features/gradebook';

export default function FacultyGradebookPage() {
  const t = useTranslations('dashboard.faculty.gradebook');
  const [courseId, setCourseId] = useState('');
  const [activeCourseId, setActiveCourseId] = useState('');

  const entriesQuery = useCourseGradebookEntries(activeCourseId, undefined, Boolean(activeCourseId));
  const dashQuery = useFacultyGradebookDashboard(activeCourseId, Boolean(activeCourseId));
  const syncMutation = useSyncCourseGradebookMutation();

  const rows = entriesQuery.data?.items ?? [];
  const dash = dashQuery.data;

  const stats = useMemo(
    () => [
      { label: t('stats.enrollments'), value: dash?.enrollmentCount, accent: 'primary' as const },
      { label: t('stats.entries'), value: dash?.entryCount, accent: 'accent' as const },
      { label: t('stats.pendingProjects'), value: dash?.pendingProjectGrades, accent: 'warning' as const },
      {
        label: t('stats.average'),
        value:
          dash?.averageWeightedPercentage != null
            ? formatPercentage(dash.averageWeightedPercentage)
            : '—',
        accent: 'success' as const,
      },
    ],
    [dash, t],
  );

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_READ} enforce>
      <div className="space-y-8">
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-soft-sm">
          <FormField label={t('courseScope')} hint={t('courseScopeDescription')}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="sm:flex-1"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder={t('courseIdPlaceholder')}
              />
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => setActiveCourseId(courseId.trim())}
                disabled={!courseId.trim()}
              >
                {t('loadCourse')}
              </Button>
              {activeCourseId ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={syncMutation.isPending}
                  onClick={() => syncMutation.mutate(activeCourseId)}
                >
                  {t('sync')}
                </Button>
              ) : null}
            </div>
          </FormField>
        </div>

        {activeCourseId ? (
          <StatGrid className="sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value ?? '—'}
                accent={stat.accent}
                loading={dashQuery.isLoading}
              />
            ))}
          </StatGrid>
        ) : null}

        <div>
          <div className="mb-4">
            <h2 className="text-section-title">{t('listTitle')}</h2>
            <p className="mt-1 text-caption">{t('listDescription')}</p>
          </div>

          {!activeCourseId ? (
            <EmptyState
              icon={GraduationCap}
              title={t('selectCourseTitle')}
              description={t('selectCourseDescription')}
            />
          ) : entriesQuery.isError ? (
            <ErrorState message={t('error')} onRetry={() => entriesQuery.refetch()} />
          ) : entriesQuery.isLoading ? (
            <GradebookSpreadsheet rows={[]} loading />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
            />
          ) : (
            <GradebookSpreadsheet rows={rows} frozenLabel={t('listTitle')} />
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
