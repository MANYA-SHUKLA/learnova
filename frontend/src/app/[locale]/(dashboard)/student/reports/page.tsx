'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import { ReportExportMenu, useStudentReport } from '@/features/reports';

export default function StudentReportsPage() {
  const t = useTranslations('dashboard.student.reports');
  const reportQuery = useStudentReport();
  const data = reportQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.ANALYTICS_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <ReportExportMenu scope="student" />
        </div>

        {reportQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => reportQuery.refetch()} />
        ) : reportQuery.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.completedCourses')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.completedCourseCount ?? 0}</p>
              </Card>
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.inProgress')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.learningProgress.coursesInProgress ?? 0}</p>
              </Card>
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.hoursLearned')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.learningProgress.hoursLearned ?? 0}</p>
              </Card>
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.averageProgress')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.learningProgress.averageProgress ?? 0}%</p>
              </Card>
            </div>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('gradesTitle')}</CardTitle>
                <CardDescription>{t('gradesDescription')}</CardDescription>
              </CardHeader>
              <div className="divide-y divide-border px-6 pb-6 text-sm">
                {(data?.grades ?? []).map((row) => (
                  <div key={row.courseId} className="flex justify-between py-3">
                    <span className="font-medium">{row.courseTitle}</span>
                    <span className="text-muted-foreground">
                      {row.percentage ?? '—'}% · {row.letterGrade ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border/80 p-4">
              <p className="text-sm text-muted-foreground">{t('attendanceNote')}</p>
              <p className="mt-1 text-sm">{data?.attendanceNote}</p>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
