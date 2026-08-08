'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect } from '@/components/shared/entity-selects';
import { ErrorState } from '@/features/institution';
import { ReportExportMenu, useFacultyReport } from '@/features/reports';

export default function FacultyReportsPage() {
  const t = useTranslations('dashboard.faculty.reports');
  const [courseId, setCourseId] = useState('');
  const reportQuery = useFacultyReport(courseId, Boolean(courseId));
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
          {courseId ? <ReportExportMenu scope="faculty" courseId={courseId} /> : null}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('courseScope')}</CardTitle>
            <CourseSelect className="mt-3 max-w-md" value={courseId} onChange={setCourseId} />
          </CardHeader>
        </Card>

        {!courseId ? (
          <p className="text-sm text-muted-foreground">{t('selectCourse')}</p>
        ) : reportQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => reportQuery.refetch()} />
        ) : reportQuery.isLoading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.courseProgress')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.courseProgress.averageProgress ?? 0}%</p>
              </Card>
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.assignmentCompletion')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.assignmentCompletionRate ?? 0}%</p>
              </Card>
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.examPass')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.examPassRate ?? 0}%</p>
              </Card>
              <Card className="rounded-2xl border-border/80 p-4">
                <p className="text-sm text-muted-foreground">{t('stats.completed')}</p>
                <p className="mt-1 text-2xl font-semibold">{data?.courseProgress.studentsCompleted ?? 0}</p>
              </Card>
            </div>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('performanceTitle')}</CardTitle>
                <CardDescription>{t('performanceDescription')}</CardDescription>
              </CardHeader>
              <div className="divide-y divide-border px-6 pb-6 text-sm">
                {(data?.studentPerformance ?? []).slice(0, 30).map((row) => (
                  <div key={row.studentId} className="flex justify-between py-3">
                    <span className="font-mono text-xs">{row.studentId.slice(-8)}</span>
                    <span className="text-muted-foreground">
                      {row.percentage ?? '—'}% · {row.letterGrade ?? '—'} · {row.result ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
