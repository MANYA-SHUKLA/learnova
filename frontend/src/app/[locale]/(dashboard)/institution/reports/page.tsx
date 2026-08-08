'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { GraduationCap, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  ReportExportMenu,
  useInstitutionReport,
} from '@/features/reports';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-soft-sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function InstitutionReportsPage() {
  const t = useTranslations('dashboard.institution.reports');
  const reportQuery = useInstitutionReport();
  const data = reportQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.ANALYTICS_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <ReportExportMenu scope="institution" />
        </div>

        {reportQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => reportQuery.refetch()} />
        ) : reportQuery.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t('stats.students')} value={data?.overview.totalStudents ?? 0} />
              <StatCard label={t('stats.faculty')} value={data?.overview.totalFaculty ?? 0} />
              <StatCard label={t('stats.activeCourses')} value={data?.overview.activeCourses ?? 0} />
              <StatCard
                label={t('stats.courseCompletion')}
                value={`${data?.overview.courseCompletionRate ?? 0}%`}
              />
              <StatCard
                label={t('stats.examPass')}
                value={`${data?.overview.examPassPercentage ?? 0}%`}
              />
              <StatCard
                label={t('stats.enrollments')}
                value={data?.overview.activeEnrollments ?? 0}
              />
            </div>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
                  {t('departmentsTitle')}
                </CardTitle>
                <CardDescription>{t('departmentsDescription')}</CardDescription>
              </CardHeader>
              <div className="divide-y divide-border px-6 pb-6 text-sm">
                {(data?.departments ?? []).slice(0, 20).map((row) => (
                  <div key={row.departmentId ?? row.label} className="flex justify-between py-3">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.studentCount} {t('studentsShort')} · {row.averageProgress}% {t('progressShort')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="size-4 text-primary" />
                  {t('semestersTitle')}
                </CardTitle>
                <CardDescription>{t('semestersDescription')}</CardDescription>
              </CardHeader>
              <div className="divide-y divide-border px-6 pb-6 text-sm">
                {(data?.semesters ?? []).map((row) => (
                  <div key={row.semesterId} className="flex justify-between py-3">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.studentCount} {t('studentsShort')} · GPA {row.averageGpa ?? '—'}
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
