'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Button, Card, CardDescription, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  useReviewTranscriptRequestMutation,
  useTranscriptRequestsQuery,
} from '@/features/gradebook';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'completed', 'rejected'] as const;

export default function InstitutionTranscriptsPage() {
  const t = useTranslations('dashboard.institution.transcripts');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const requestsQuery = useTranscriptRequestsQuery(
    status === 'all' ? undefined : { status },
  );
  const reviewMutation = useReviewTranscriptRequestMutation();
  const rows = requestsQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_MANAGE} enforce>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={status === filter ? 'default' : 'outline'}
              onClick={() => {
                setStatus(filter);
              }}
            >
              {t(`filters.${filter}`)}
            </Button>
          ))}
        </div>

        {requestsQuery.isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : rows.length === 0 ? (
          <Card className="rounded-2xl border-border/80 p-6">
            <CardDescription>{t('empty')}</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id} className="rounded-2xl border-border/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.requestType ?? 'official'}</p>
                    <p className="text-sm text-muted-foreground">{row.reason ?? ''}</p>
                    <Badge variant="outline" className="mt-2">
                      {row.status ?? 'pending'}
                    </Badge>
                  </div>
                  {row.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={reviewMutation.isPending}
                        onClick={() => {
                          void reviewMutation.mutateAsync({
                            requestId: row.id,
                            status: 'approved',
                          });
                        }}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() => {
                          void reviewMutation.mutateAsync({
                            requestId: row.id,
                            status: 'rejected',
                          });
                        }}
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
