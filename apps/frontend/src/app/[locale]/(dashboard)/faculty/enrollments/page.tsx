'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Search, UserRound, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatEnrollmentStatus,
  useApproveEnrollmentMutation,
  useEnrollmentList,
  useRejectEnrollmentMutation,
} from '@/features/enrollment';
import type { EnrollmentStatus } from '@/features/enrollment';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<EnrollmentStatus | 'all'> = [
  'all',
  'pending',
  'approved',
  'active',
  'completed',
];

export default function FacultyEnrollmentsPage() {
  const t = useTranslations('dashboard.faculty.enrollments');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: 20,
      sortBy: 'enrollmentDate',
      sortOrder: 'desc' as const,
    }),
    [search, status, page],
  );

  const listQuery = useEnrollmentList(params);
  const approveMutation = useApproveEnrollmentMutation();
  const rejectMutation = useRejectEnrollmentMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  const pendingCount = rows.filter((r) => r.approvalStatus === 'pending').length;

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {pendingCount > 0 ? (
          <Card className="rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <p className="text-sm font-medium">
                {pendingCount} enrollment{pendingCount === 1 ? '' : 's'} pending approval
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('directory')}</CardTitle>
            <CardDescription>{t('directoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t('searchPlaceholder')}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(q.trim());
                      setPage(1);
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch(q.trim());
                  setPage(1);
                }}
              >
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    status === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  {s === 'all' ? 'All' : formatEnrollmentStatus(s)}
                </button>
              ))}
            </div>

            {listQuery.isError ? (
              <ErrorState
                message={
                  listQuery.error instanceof Error
                    ? listQuery.error.message
                    : 'Failed to load enrollments.'
                }
                onRetry={() => void listQuery.refetch()}
              />
            ) : null}

            {listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                illustration="faculty"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
              />
            ) : (
              <>
                <div className="space-y-3">
                  {rows.map((row) => (
                    <Card key={row.id} className="rounded-2xl">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{row.enrollmentNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.enrollmentDate.slice(0, 10)}
                            </p>
                          </div>
                          <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <UserRound className="size-4" />
                            {row.studentId}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="size-4" />
                            {row.courseId}
                          </span>
                        </div>
                        {row.approvalStatus === 'pending' ? (
                          <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={approveMutation.isPending}
                                onClick={() => void approveMutation.mutateAsync(row.id)}
                              >
                                <CheckCircle2 className="size-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rejectMutation.isPending}
                                onClick={() => {
                                  const reason = prompt('Rejection reason (optional):') ?? '';
                                  void rejectMutation.mutateAsync({ id: row.id, reason });
                                }}
                              >
                                <XCircle className="size-4" />
                                Reject
                              </Button>
                            </div>
                          </PermissionGate>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {meta ? (
                  <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>
                      Page {meta.page} of {meta.totalPages} · {meta.total} total
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!meta.hasPrevPage}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!meta.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
