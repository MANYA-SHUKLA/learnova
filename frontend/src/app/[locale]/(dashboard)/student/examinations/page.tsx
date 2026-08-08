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
  useExamList,
  useStudentExamDashboard,
} from '@/features/examination';
import { Link } from '@/lib/i18n/routing';

export default function StudentExaminationsPage() {
  const t = useTranslations('dashboard.student.examinations');
  const listQuery = useExamList({
    page: 1,
    limit: 20,
    status: 'published',
    sortBy: 'startsAt',
    sortOrder: 'asc',
  });
  const dashQuery = useStudentExamDashboard();
  const rows = listQuery.data?.items ?? [];
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t('stats.upcoming'), value: dash?.upcomingExams },
            { label: t('stats.checkedIn'), value: dash?.checkedInExams },
            { label: t('stats.completed'), value: dash?.completedExams },
            {
              label: t('stats.avgScore'),
              value: dash?.averageScore != null ? dash.averageScore.toFixed(1) : '—',
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
              <Card key={exam.id} className="rounded-2xl border-border/80">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{exam.title}</CardTitle>
                      <Badge variant="outline">{formatExamStatus(exam.status)}</Badge>
                      <Badge variant="secondary">{formatExamType(exam.examType)}</Badge>
                    </div>
                    <CardDescription className="mt-2">
                      {formatExamWindow(exam.schedule.startsAt, exam.schedule.endsAt)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" size="sm">
                    <Link href={APP_ROUTES.STUDENT_EXAM_CHECKIN.replace(':id', exam.id)}>
                      {t('systemCheck')}
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={APP_ROUTES.STUDENT_EXAM_DETAIL.replace(':id', exam.id)}>
                      {t('open')}
                    </Link>
                  </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
