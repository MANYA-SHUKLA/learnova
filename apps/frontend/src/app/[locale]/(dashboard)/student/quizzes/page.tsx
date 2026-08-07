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
import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDuration,
  formatQuizStatus,
  formatQuizType,
  useQuizList,
  useStudentQuizDashboard,
} from '@/features/quiz';
import { Link } from '@/lib/i18n/routing';

export default function StudentQuizzesPage() {
  const t = useTranslations('dashboard.student.quizzes');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      status: 'published' as const,
      sortBy: 'publishDate' as const,
      sortOrder: 'desc' as const,
    }),
    [page],
  );

  const listQuery = useQuizList(params);
  const dashQuery = useStudentQuizDashboard();
  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.QUIZ_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={APP_ROUTES.STUDENT_QUIZ_RESULTS}>{t('results')}</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t('stats.upcoming'), value: dash?.upcomingQuizzes },
            { label: t('stats.completed'), value: dash?.completedQuizzes },
            { label: t('stats.pending'), value: dash?.pendingQuizzes },
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

        {listQuery.isError ? (
          <ErrorState message={t('error')} onRetry={() => listQuery.refetch()} />
        ) : listQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={ListChecks} title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          <div className="space-y-3">
            {rows.map((quiz) => (
              <Card key={quiz.id} className="rounded-2xl border-border/80">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{quiz.title}</CardTitle>
                      <Badge variant="outline">{formatQuizStatus(quiz.status)}</Badge>
                      <Badge variant="secondary">{formatQuizType(quiz.quizType)}</Badge>
                    </div>
                    <CardDescription className="mt-2">
                      {formatDuration(quiz.durationMinutes)} · {quiz.attemptLimit} {t('attempts')} ·{' '}
                      {quiz.passingMarks}/{quiz.totalMarks} {t('passMarks')}
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link href={`/student/quizzes/${quiz.id}`}>{t('start')}</Link>
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 ? (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('next')}
            </Button>
          </div>
        ) : null}
      </div>
    </PermissionGate>
  );
}
