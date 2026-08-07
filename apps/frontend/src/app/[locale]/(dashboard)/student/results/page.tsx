'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState } from '@/features/institution';
import { formatPercentage, useQuizAttempts, useStudentQuizDashboard } from '@/features/quiz';

export default function StudentQuizResultsPage() {
  const t = useTranslations('dashboard.student.results');
  const dashQuery = useStudentQuizDashboard();
  const attemptsQuery = useQuizAttempts({ page: 1, limit: 20 });
  const attempts = attemptsQuery.data?.items ?? [];
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.QUIZ_READ} enforce>
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

        {attemptsQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : attempts.length === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <Card key={attempt.id} className="rounded-2xl border-border/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {t('attempt')} #{attempt.attemptNumber}
                    </CardTitle>
                    <CardDescription>
                      {formatPercentage(attempt.percentage)} · {attempt.score.toFixed(1)} {t('points')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{attempt.status}</Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
