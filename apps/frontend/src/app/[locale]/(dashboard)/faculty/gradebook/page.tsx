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
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatActivityKind,
  formatMarks,
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
      { label: t('stats.enrollments'), value: dash?.enrollmentCount },
      { label: t('stats.entries'), value: dash?.entryCount },
      { label: t('stats.pendingProjects'), value: dash?.pendingProjectGrades },
      {
        label: t('stats.average'),
        value: dash?.averageWeightedPercentage != null ? formatPercentage(dash.averageWeightedPercentage) : '—',
      },
    ],
    [dash, t],
  );

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
            <div className="flex flex-wrap gap-2">
              <Input
                className="sm:w-72"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder={t('courseIdPlaceholder')}
              />
              <Button
                variant="secondary"
                onClick={() => setActiveCourseId(courseId.trim())}
                disabled={!courseId.trim()}
              >
                {t('loadCourse')}
              </Button>
              {activeCourseId ? (
                <Button
                  variant="outline"
                  disabled={syncMutation.isPending}
                  onClick={() => syncMutation.mutate(activeCourseId)}
                >
                  {t('sync')}
                </Button>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        {activeCourseId ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
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
          ) : entriesQuery.isError ? (
            <div className="p-6">
              <ErrorState message={t('error')} onRetry={() => entriesQuery.refetch()} />
            </div>
          ) : entriesQuery.isLoading ? (
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
                <div key={entry.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{entry.activityTitle}</p>
                      <Badge variant="outline">{formatActivityKind(entry.activityKind)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMarks(entry.marksObtained, entry.totalMarks)} · {formatPercentage(entry.percentage)}
                    </p>
                  </div>
                  <Badge variant="secondary">{entry.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
