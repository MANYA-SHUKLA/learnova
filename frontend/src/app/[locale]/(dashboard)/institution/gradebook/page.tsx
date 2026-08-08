'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect } from '@/components/shared/entity-selects';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatActivityKind,
  formatMarks,
  formatPercentage,
  useFinalizeCourseGradesMutation,
  useGradebookList,
  useInstitutionGradebookDashboard,
  useSyncCourseGradebookMutation,
} from '@/features/gradebook';

export default function InstitutionGradebookPage() {
  const t = useTranslations('dashboard.institution.gradebook');
  const [activeCourseId, setActiveCourseId] = useState('');

  const listParams = useMemo(
    () => ({
      courseId: activeCourseId || undefined,
      page: 1,
      limit: 25,
    }),
    [activeCourseId],
  );

  const listQuery = useGradebookList(listParams, Boolean(activeCourseId));
  const dashQuery = useInstitutionGradebookDashboard(activeCourseId || undefined);
  const syncMutation = useSyncCourseGradebookMutation();
  const finalizeMutation = useFinalizeCourseGradesMutation();

  const rows = listQuery.data?.items ?? [];
  const dash = dashQuery.data as
    | {
        enrollmentCount?: number;
        entryCount?: number;
        finalizedSummaries?: number;
        pendingProjectGrades?: number;
        averageWeightedPercentage?: number;
      }
    | undefined;

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('courseScope')}</CardTitle>
              <CardDescription>{t('courseScopeDescription')}</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <CourseSelect
                className="sm:w-80"
                value={activeCourseId}
                onChange={setActiveCourseId}
              />
              {activeCourseId ? (
                <>
                  <Button
                    variant="outline"
                    disabled={syncMutation.isPending}
                    onClick={() => { syncMutation.mutate(activeCourseId); }}
                  >
                    {t('sync')}
                  </Button>
                  <Button
                    disabled={finalizeMutation.isPending}
                    onClick={() => { finalizeMutation.mutate(activeCourseId); }}
                  >
                    {t('finalize')}
                  </Button>
                </>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        {activeCourseId ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: t('stats.enrollments'), value: dash?.enrollmentCount },
              { label: t('stats.entries'), value: dash?.entryCount },
              { label: t('stats.finalized'), value: dash?.finalizedSummaries },
              { label: t('stats.pendingProjects'), value: dash?.pendingProjectGrades },
              {
                label: t('stats.average'),
                value:
                  dash?.averageWeightedPercentage != null
                    ? formatPercentage(dash.averageWeightedPercentage)
                    : '—',
              },
            ].map((stat) => (
              <Card key={stat.label} className="rounded-2xl border-border/80">
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-2xl">
                    {dashQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (stat.value ?? '—')}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('listTitle')}</CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>

          {!activeCourseId ? (
            <div className="p-6">
              <EmptyState
                icon={GraduationCap}
                title={t('selectCourseTitle')}
                description={t('selectCourseDescription')}
              />
            </div>
          ) : listQuery.isError ? (
            <div className="p-6">
              <ErrorState message={t('error')} onRetry={() => listQuery.refetch()} />
            </div>
          ) : listQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={GraduationCap} title={t('emptyTitle')} description={t('emptyDescription')} />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{entry.activityTitle}</p>
                      <Badge variant="outline">{formatActivityKind(entry.activityKind)}</Badge>
                      <Badge variant="secondary">{entry.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMarks(entry.marksObtained, entry.totalMarks)} ·{' '}
                      {formatPercentage(entry.percentage)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('weight', { value: entry.weightage })}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
