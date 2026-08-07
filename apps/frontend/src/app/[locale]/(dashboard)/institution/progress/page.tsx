'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { BarChart3, BookOpen, Clock3, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  ProgressStatCards,
  formatPercent,
  useInstitutionProgressDashboard,
} from '@/features/progress';

export default function InstitutionProgressPage() {
  const t = useTranslations('dashboard.institution.progress');
  const dashboardQuery = useInstitutionProgressDashboard();
  const data = dashboardQuery.data;

  const stats = [
    {
      id: 'hours',
      label: t('stats.totalHours'),
      value: data?.totalLearningHours ?? 0,
      icon: Clock3,
    },
    {
      id: 'completion',
      label: t('stats.completionRate'),
      value: formatPercent(data?.courseCompletionRate ?? 0),
      icon: BarChart3,
    },
    {
      id: 'engagement',
      label: t('stats.engagement'),
      value: formatPercent(data?.studentEngagement ?? 0),
      icon: Users,
    },
    {
      id: 'courses',
      label: t('stats.activeCourses'),
      value: data?.mostActiveCourses.length ?? 0,
      icon: BookOpen,
    },
  ];

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

        {dashboardQuery.isError ? (
          <ErrorState
            message={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : t('loadError')
            }
            onRetry={() => void dashboardQuery.refetch()}
          />
        ) : null}

        <ProgressStatCards items={stats} loading={dashboardQuery.isLoading} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('byDepartment')}</CardTitle>
              <CardDescription>{t('byDepartmentDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))
              ) : (data?.byDepartment.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noData')}</p>
              ) : (
                data?.byDepartment.map((row) => (
                  <div
                    key={row.departmentId ?? row.label}
                    className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('studentsCount', { count: row.count })}
                      </p>
                    </div>
                    <Badge variant="secondary">{formatPercent(row.averageProgress)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('byProgram')}</CardTitle>
              <CardDescription>{t('byProgramDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))
              ) : (data?.byProgram.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noData')}</p>
              ) : (
                data?.byProgram.map((row) => (
                  <div
                    key={row.programId ?? row.label}
                    className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('studentsCount', { count: row.count })}
                      </p>
                    </div>
                    <Badge variant="outline">{formatPercent(row.averageProgress)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('mostActive')}</CardTitle>
            <CardDescription>{t('mostActiveDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))
            ) : (data?.mostActiveCourses.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
            ) : (
              data?.mostActiveCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.hours}h · {formatPercent(course.averageProgress)}
                    </p>
                  </div>
                  <Badge variant="secondary">{course.courseId}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
