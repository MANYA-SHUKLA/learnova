'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { formatPercentage, useStudentGradebookDashboard } from '@/features/gradebook';
import { gradebookApi } from '@/features/gradebook/services/gradebook-api';
import { useQuery } from '@tanstack/react-query';

export default function StudentSemesterPage() {
  const t = useTranslations('dashboard.student.gradebook');
  const dashQuery = useStudentGradebookDashboard();
  const semesterQuery = useQuery({
    queryKey: ['gradebook', 'semester'],
    queryFn: () => gradebookApi.semesterGrades(),
    staleTime: 60_000,
  });

  const dash = dashQuery.data;
  const semesters = semesterQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Semester Results
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aggregated semester GPA and credit totals from published course grades.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Semester GPA', value: dash?.semesterGpa != null ? dash.semesterGpa.toFixed(2) : '—' },
            { label: 'CGPA', value: dash?.cgpa != null ? dash.cgpa.toFixed(2) : '—' },
            { label: 'Published courses', value: dash?.publishedCourses },
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

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Semester breakdown</CardTitle>
            <CardDescription>Credit-weighted GPA per academic semester</CardDescription>
          </CardHeader>
          {semesterQuery.isError ? (
            <div className="p-6">
              <ErrorState message={t('error')} onRetry={() => semesterQuery.refetch()} />
            </div>
          ) : semesterQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : semesters.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={GraduationCap}
                title="No semester grades"
                description="Semester GPA is computed after course grades are published."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {semesters.map((row) => (
                <div key={row.id} className="flex items-center justify-between p-4 text-sm">
                  <span>Semester {row.semesterId}</span>
                  <span>
                    GPA {row.semesterGpa != null ? row.semesterGpa.toFixed(2) : '—'} ·{' '}
                    {row.earnedCredits}/{row.totalCredits} credits
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
