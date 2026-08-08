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
  DataTable,
  Input,
  PageHeader,
} from '@learnova/ui';
import { BookOpen, CheckCircle2, Search, UserRound, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatEnrollmentStatus,
  useApproveEnrollmentMutation,
  useEnrollmentList,
  useRejectEnrollmentMutation,
} from '@/features/enrollment';
import type { EnrollmentStatus } from '@/features/enrollment';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: (EnrollmentStatus | 'all')[] = [
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
      <DashboardPage>
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        {pendingCount > 0 ? (
          <Card className="rounded-xl border-primary/30 bg-primary/5 shadow-soft-sm">
            <CardContent className="py-4">
              <p className="text-sm font-medium">
                {pendingCount} enrollment{pendingCount === 1 ? '' : 's'} pending approval
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('directory')}</CardTitle>
            <CardDescription>{t('directoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {listQuery.isError ? (
              <ErrorState
                message={
                  listQuery.error instanceof Error
                    ? listQuery.error.message
                    : 'Failed to load enrollments.'
                }
                onRetry={() => void listQuery.refetch()}
              />
            ) : (
              <DataTable
                caption={t('directory')}
                loading={listQuery.isLoading}
                data={rows}
                rowKey={(row) => row.id}
                filters={
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
                        {s === 'all' ? tCommon('all') : formatEnrollmentStatus(s)}
                      </button>
                    ))}
                  </div>
                }
                toolbar={
                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <div className="relative min-w-0 flex-1 sm:w-64">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="rounded-xl pl-9"
                        placeholder={t('searchPlaceholder')}
                        value={q}
                        onChange={(e) => { setQ(e.target.value); }}
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
                      className="rounded-xl"
                      onClick={() => {
                        setSearch(q.trim());
                        setPage(1);
                      }}
                    >
                      {tCommon('search')}
                    </Button>
                  </div>
                }
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                pagination={
                  meta
                    ? {
                        page: meta.page,
                        totalPages: meta.totalPages,
                        total: meta.total,
                        hasNextPage: meta.hasNextPage,
                        hasPrevPage: meta.hasPrevPage,
                        onPageChange: setPage,
                      }
                    : undefined
                }
                columns={[
                  {
                    id: 'number',
                    header: 'Enrollment #',
                    cell: (row) => <span className="font-medium">{row.enrollmentNumber}</span>,
                  },
                  {
                    id: 'student',
                    header: 'Student',
                    cell: (row) => (
                      <span className="flex items-center gap-2 text-sm">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden />
                        {row.studentId}
                      </span>
                    ),
                  },
                  {
                    id: 'course',
                    header: 'Course',
                    cell: (row) => (
                      <span className="flex items-center gap-2 text-sm">
                        <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                        {row.courseId}
                      </span>
                    ),
                  },
                  {
                    id: 'date',
                    header: 'Date',
                    cell: (row) => (
                      <span className="tabular-nums text-sm">{row.enrollmentDate.slice(0, 10)}</span>
                    ),
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => (
                      <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                    ),
                  },
                ]}
                rowActions={(row) =>
                  row.approvalStatus === 'pending' ? (
                    <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={approveMutation.isPending}
                        onClick={() => void approveMutation.mutateAsync(row.id)}
                      >
                        <CheckCircle2 className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={rejectMutation.isPending}
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):') ?? '';
                          void rejectMutation.mutateAsync({ id: row.id, reason });
                        }}
                      >
                        <XCircle className="size-4" />
                        Reject
                      </Button>
                    </PermissionGate>
                  ) : null
                }
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.enrollmentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.enrollmentDate.slice(0, 10)}
                          </p>
                        </div>
                        <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.studentId} · {row.courseId}
                      </p>
                      {row.approvalStatus === 'pending' ? (
                        <PermissionGate permission={PERMISSIONS.ENROLLMENT_WRITE}>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={approveMutation.isPending}
                              onClick={() => void approveMutation.mutateAsync(row.id)}
                            >
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
                              Reject
                            </Button>
                          </div>
                        </PermissionGate>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </CardContent>
        </Card>
      </DashboardPage>
    </PermissionGate>
  );
}
