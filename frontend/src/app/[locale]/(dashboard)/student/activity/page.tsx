'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import { ActivityTimeline, useActivity } from '@/features/progress';

export default function StudentActivityPage() {
  const t = useTranslations('dashboard.student.progress.activity');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: 30,
      sortBy: 'occurredAt',
      sortOrder: 'desc' as const,
    }),
    [page],
  );

  const activityQuery = useActivity(params);
  const items = activityQuery.data?.items ?? [];
  const meta = activityQuery.data?.meta;

  return (
    <PermissionGate permission={PERMISSIONS.PROGRESS_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {activityQuery.isError ? (
          <ErrorState
            message={
              activityQuery.error instanceof Error
                ? activityQuery.error.message
                : t('loadError')
            }
            onRetry={() => void activityQuery.refetch()}
          />
        ) : null}

        <ActivityTimeline
          items={items}
          loading={activityQuery.isLoading}
          title={t('timelineTitle')}
          description={t('timelineDescription')}
          emptyLabel={t('empty')}
        />

        {meta && meta.totalPages > 1 ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('pagination')}</CardTitle>
              <CardDescription>
                {t('pageOf', { page: meta.page, total: meta.totalPages })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                disabled={!meta.hasPrevPage}
                onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
              >
                {t('prev')}
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                disabled={!meta.hasNextPage}
                onClick={() => { setPage((p) => p + 1); }}
              >
                {t('next')}
              </button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PermissionGate>
  );
}
