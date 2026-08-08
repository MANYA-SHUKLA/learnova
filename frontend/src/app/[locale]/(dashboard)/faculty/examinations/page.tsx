'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState } from '@/features/institution';
import {
  formatExamStatus,
  formatExamType,
  formatExamWindow,
  formatProctoringMode,
  useExamList,
  useFacultyExamDashboard,
} from '@/features/examination';
import { Link } from '@/lib/i18n/routing';

export default function FacultyExaminationsPage() {
  const t = useTranslations('dashboard.faculty.examinations');
  const listQuery = useExamList({ page: 1, limit: 20, sortBy: 'startsAt', sortOrder: 'asc' });
  const dashQuery = useFacultyExamDashboard();
  const rows = listQuery.data?.items ?? [];
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_READ} enforce>
      <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={APP_ROUTES.FACULTY_EXAM_CREATE}>{t('create')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.FACULTY_PROCTORING}>{t('proctoring')}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t('stats.scheduled'), value: dash?.examsScheduled },
            { label: t('stats.inProgress'), value: dash?.examsInProgress },
            { label: t('stats.attempts'), value: dash?.totalAttempts },
            {
              label: t('stats.violations'),
              value: dash ? `${Math.round(dash.violationRate * 100)}%` : '—',
            },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-border/80">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (stat.value ?? '—')}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {rows.length === 0 && !listQuery.isLoading ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          <div className="space-y-3">
            {rows.map((exam) => (
              <Card key={exam.id} className="rounded-2xl border-border/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={APP_ROUTES.FACULTY_EXAM_DETAIL.replace(':id', exam.id)}
                        className="font-medium hover:underline"
                      >
                        {exam.title}
                      </Link>
                      <Badge variant="outline">{formatExamStatus(exam.status)}</Badge>
                      <Badge variant="secondary">{formatProctoringMode(exam.proctoring.mode)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatExamType(exam.examType)} ·{' '}
                      {formatExamWindow(exam.schedule.startsAt, exam.schedule.endsAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
