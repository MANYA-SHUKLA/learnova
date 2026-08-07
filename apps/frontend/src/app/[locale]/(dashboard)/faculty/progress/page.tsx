'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { BarChart3, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { useCourseList } from '@/features/course';
import {
  ProgressStatCards,
  formatPercent,
  useFacultyProgressDashboard,
} from '@/features/progress';

export default function FacultyProgressPage() {
  const t = useTranslations('dashboard.faculty.progress');
  const [courseId, setCourseId] = useState('');

  const coursesQuery = useCourseList({ page: 1, limit: 50, sortBy: 'title', sortOrder: 'asc' });
  const courses = coursesQuery.data?.items ?? [];

  useEffect(() => {
    if (!courseId && courses.length > 0) {
      setCourseId(courses[0]!.id);
    }
  }, [courseId, courses]);

  const dashboardQuery = useFacultyProgressDashboard(courseId, Boolean(courseId));
  const data = dashboardQuery.data;

  const stats = data
    ? [
        {
          id: 'average',
          label: t('stats.averageProgress'),
          value: formatPercent(data.averageProgress),
          icon: BarChart3,
        },
        {
          id: 'started',
          label: t('stats.started'),
          value: data.studentsStarted,
          icon: Users,
        },
        {
          id: 'inProgress',
          label: t('stats.inProgress'),
          value: data.studentsInProgress,
        },
        {
          id: 'completed',
          label: t('stats.completed'),
          value: data.studentsCompleted,
        },
      ]
    : [];

  return (
    <PermissionGate permission={PERMISSIONS.PROGRESS_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('selectTitle')}</CardTitle>
            <CardDescription>{t('selectDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-md"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={coursesQuery.isLoading || courses.length === 0}
            >
              {courses.length === 0 ? (
                <option value="">{t('emptyTitle')}</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.title}
                  </option>
                ))
              )}
            </select>
            <Button
              variant="outline"
              disabled={!courseId || dashboardQuery.isFetching}
              onClick={() => void dashboardQuery.refetch()}
            >
              {t('load')}
            </Button>
          </CardContent>
        </Card>

        {!courseId ? (
          <EmptyState
            illustration="inbox"
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        ) : dashboardQuery.isError ? (
          <ErrorState
            message={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : t('loadError')
            }
            onRetry={() => void dashboardQuery.refetch()}
          />
        ) : (
          <>
            <ProgressStatCards items={stats} loading={dashboardQuery.isLoading} />

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('topLearners')}</CardTitle>
                  <CardDescription>{t('topLearnersDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardQuery.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))
                  ) : (data?.topLearners.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noLearners')}</p>
                  ) : (
                    data?.topLearners.map((learner) => (
                      <div
                        key={learner.studentId}
                        className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"
                      >
                        <p className="truncate text-sm font-medium">{learner.studentId}</p>
                        <Badge variant="secondary">
                          {formatPercent(learner.progressPercentage)}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('leastActive')}</CardTitle>
                  <CardDescription>{t('leastActiveDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardQuery.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))
                  ) : (data?.leastActive.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noLearners')}</p>
                  ) : (
                    data?.leastActive.map((learner) => (
                      <div
                        key={learner.studentId}
                        className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{learner.studentId}</p>
                          <p className="text-xs text-muted-foreground">
                            {learner.lastAccessedAt
                              ? learner.lastAccessedAt.slice(0, 10)
                              : t('neverAccessed')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {formatPercent(learner.progressPercentage)}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
