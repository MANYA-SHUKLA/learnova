'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatActivityKind,
  formatMarks,
  formatPercentage,
  useGradebookList,
  useStudentGradebookDashboard,
} from '@/features/gradebook';

export default function StudentGradebookPage() {
  const t = useTranslations('dashboard.student.gradebook');
  const dashQuery = useStudentGradebookDashboard();
  const listQuery = useGradebookList({ page: 1, limit: 20 });
  const dash = dashQuery.data;
  const rows = listQuery.data?.items ?? [];

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

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: t('stats.courses'), value: dash?.courseCount },
            { label: t('stats.finalized'), value: dash?.finalizedCourses },
            {
              label: t('stats.average'),
              value: dash ? formatPercentage(dash.averagePercentage) : '—',
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

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('listTitle')}</CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>

          {listQuery.isError ? (
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
                  <Badge variant={entry.passed ? 'default' : 'secondary'}>
                    {entry.passed == null ? entry.status : entry.passed ? t('passed') : t('notPassed')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
