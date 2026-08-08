'use client';

import { PERMISSIONS } from '@learnova/constants';
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
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatExamStatus,
  formatExamType,
  formatExamWindow,
  useExamList,
  useInstitutionExamDashboard,
  usePublishExamMutation,
} from '@/features/examination';

export default function InstitutionExaminationsPage() {
  const t = useTranslations('dashboard.institution.examinations');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ q: search || undefined, page, limit: 20, sortBy: 'startsAt' as const, sortOrder: 'desc' as const }),
    [search, page],
  );

  const listQuery = useExamList(params);
  const dashQuery = useInstitutionExamDashboard();
  const publishMutation = usePublishExamMutation();
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t('stats.total'), value: dash?.totalExams },
            { label: t('stats.scheduled'), value: dash?.scheduledExams },
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
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((exam) => (
                <div
                  key={exam.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{exam.title}</p>
                      <Badge variant="outline">{formatExamStatus(exam.status)}</Badge>
                      <Badge variant="secondary">{formatExamType(exam.examType)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatExamWindow(exam.schedule.startsAt, exam.schedule.endsAt)}
                    </p>
                  </div>
                  {exam.status === 'draft' ? (
                    <Button
                      size="sm"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(exam.id)}
                    >
                      {t('publish')}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGate>
  );
}
