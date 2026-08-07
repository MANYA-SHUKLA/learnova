'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDuration,
  formatQuizDifficulty,
  formatQuizStatus,
  formatQuizType,
  useInstitutionQuizDashboard,
  usePublishQuizMutation,
  useQuizList,
} from '@/features/quiz';
import { Link } from '@/lib/i18n/routing';

export default function InstitutionQuizzesPage() {
  const t = useTranslations('dashboard.institution.quizzes');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ q: search || undefined, page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' as const }),
    [search, page],
  );

  const listQuery = useQuizList(params);
  const dashQuery = useInstitutionQuizDashboard();
  const publishMutation = usePublishQuizMutation();
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
            <Link href={APP_ROUTES.INSTITUTION_QUESTION_BANK}>{t('questionBank')}</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t('stats.total'), value: dash?.totalQuizzes },
            { label: t('stats.bankSize'), value: dash?.questionBankSize },
            { label: t('stats.attempts'), value: dash?.totalAttempts },
            {
              label: t('stats.avgScore'),
              value: dash?.averageScore != null ? dash.averageScore.toFixed(1) : '—',
            },
            {
              label: t('stats.passRate'),
              value: dash ? `${Math.round(dash.passRate * 100)}%` : '—',
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
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('listTitle')}</CardTitle>
              <CardDescription>{t('listDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                className="sm:w-56"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(q.trim());
                    setPage(1);
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch(q.trim());
                  setPage(1);
                }}
              >
                {t('search')}
              </Button>
            </div>
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
              <EmptyState icon={ListChecks} title={t('emptyTitle')} description={t('emptyDescription')} />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{quiz.title}</p>
                      <Badge variant="outline">{formatQuizStatus(quiz.status)}</Badge>
                      <Badge variant="secondary">{formatQuizType(quiz.quizType)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatQuizDifficulty(quiz.difficulty)} · {formatDuration(quiz.durationMinutes)} ·{' '}
                      {quiz.totalMarks} {t('marks')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {quiz.status === 'draft' ? (
                      <Button
                        size="sm"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate(quiz.id)}
                      >
                        {t('publish')}
                      </Button>
                    ) : null}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${APP_ROUTES.INSTITUTION_QUIZZES}/${quiz.id}`}>{t('view')}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border/60 p-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {meta.page} / {meta.totalPages}
              </span>
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
        </Card>
      </div>
    </PermissionGate>
  );
}
