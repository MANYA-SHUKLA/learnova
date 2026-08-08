'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
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
  StatCard,
  StatGrid,
} from '@learnova/ui';
import { ArrowRight, BookOpen, Download, GraduationCap, Plus, Search, Upload, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatEnrollmentStatus,
  useArchiveEnrollmentMutation,
  useBulkApproveEnrollmentMutation,
  useBulkArchiveEnrollmentMutation,
  useBulkRejectEnrollmentMutation,
  useEnrollmentList,
  useEnrollmentStats,
  useRestoreEnrollmentMutation,
} from '@/features/enrollment';
import type { EnrollmentStatus } from '@/features/enrollment';
import { Link } from '@/lib/i18n/routing';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<EnrollmentStatus | 'all'> = [
  'all',
  'pending',
  'approved',
  'active',
  'completed',
  'withdrawn',
  'rejected',
];

export default function EnrollmentListPage() {
  const t = useTranslations('dashboard.institution.enrollments');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      includeDeleted: false,
      page,
      limit: 20,
      sortBy: 'enrollmentDate',
      sortOrder: 'desc' as const,
    }),
    [search, status, page],
  );

  const listQuery = useEnrollmentList(params);
  const statsQuery = useEnrollmentStats();
  const archiveMutation = useArchiveEnrollmentMutation();
  const restoreMutation = useRestoreEnrollmentMutation();
  const bulkApprove = useBulkApproveEnrollmentMutation();
  const bulkReject = useBulkRejectEnrollmentMutation();
  const bulkArchive = useBulkArchiveEnrollmentMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;

  const downloadExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const token = getAccessToken();
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/enrollments/export?format=${format}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments-export.${format === 'excel' ? 'xls' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_READ} enforce>
      <DashboardPage>
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          actions={
            <>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_IMPORT}>
                  <Upload className="size-4" />
                  {tCommon('import')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_EXPORT}>
                  <Download className="size-4" />
                  {tCommon('export')}
                </Link>
              </Button>
              <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                <Button asChild className="rounded-xl">
                  <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_CREATE}>
                    <Plus className="size-4" />
                    {t('addEnrollment')}
                  </Link>
                </Button>
              </PermissionGate>
            </>
          }
        />

        <StatGrid className="sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {statsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <StatCard key={i} label="…" value="—" loading />
              ))
            : [
                { label: t('stats.total'), value: stats?.total ?? 0 },
                { label: t('stats.active'), value: stats?.active ?? 0 },
                { label: t('stats.pending'), value: stats?.pending ?? 0 },
                { label: t('stats.completed'), value: stats?.completed ?? 0 },
                { label: t('stats.withdrawn'), value: stats?.withdrawn ?? 0 },
                { label: t('stats.waitlisted'), value: stats?.waitlisted ?? 0 },
              ].map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value.toLocaleString()}
                  accent="primary"
                />
              ))}
        </StatGrid>

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('directory')}</CardTitle>
            <CardDescription>{t('directoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                selectable
                selectedIds={selected}
                onSelectionChange={setSelected}
                bulkActions={
                  <>
                    <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={bulkApprove.isPending}
                        onClick={() =>
                          void bulkApprove.mutateAsync({ ids: selected }).then(() => setSelected([]))
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={bulkReject.isPending}
                        onClick={() =>
                          void bulkReject.mutateAsync({ ids: selected }).then(() => setSelected([]))
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="rounded-xl"
                        disabled={bulkArchive.isPending}
                        onClick={() => void bulkArchive.mutateAsync(selected).then(() => setSelected([]))}
                      >
                        Delete
                      </Button>
                    </PermissionGate>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => void downloadExport('csv')}
                    >
                      Export CSV
                    </Button>
                  </>
                }
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
                emptyAction={
                  <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                    <Button asChild className="rounded-xl">
                      <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_CREATE}>
                        {t('addEnrollment')}
                      </Link>
                    </Button>
                  </PermissionGate>
                }
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
                    sortable: true,
                    sortValue: (row) => row.enrollmentNumber,
                    cell: (row) => <span className="tabular-nums">{row.enrollmentNumber}</span>,
                  },
                  {
                    id: 'student',
                    header: 'Student',
                    cell: (row) => (
                      <span className="flex items-center gap-2">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden />
                        {row.studentId}
                      </span>
                    ),
                  },
                  {
                    id: 'course',
                    header: 'Course',
                    cell: (row) => (
                      <span className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                        {row.courseId}
                      </span>
                    ),
                  },
                  {
                    id: 'date',
                    header: 'Date',
                    sortable: true,
                    sortValue: (row) => row.enrollmentDate,
                    cell: (row) => (
                      <span className="tabular-nums">{row.enrollmentDate.slice(0, 10)}</span>
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
                rowActions={(row) => (
                  <>
                    <Button asChild size="sm" variant="ghost" className="rounded-lg">
                      <Link href={`${APP_ROUTES.INSTITUTION_ENROLLMENTS}/${row.id}`}>
                        {tCommon('view')}
                      </Link>
                    </Button>
                    <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                      {row.deletedAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={restoreMutation.isPending}
                          onClick={() => void restoreMutation.mutateAsync(row.id)}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={archiveMutation.isPending}
                          onClick={() => void archiveMutation.mutateAsync(row.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </PermissionGate>
                  </>
                )}
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
                        Student: {row.studentId} · Course: {row.courseId}
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                        <Link href={`${APP_ROUTES.INSTITUTION_ENROLLMENTS}/${row.id}`}>
                          {tCommon('view')}
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </CardContent>
        </Card>

        {stats && (stats.byCourse.length > 0 || stats.byDepartment.length > 0) ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-xl border-border/80 shadow-soft-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-title">
                  <BookOpen className="size-4 text-primary" aria-hidden />
                  Course distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.byCourse.slice(0, 10).map((d) => (
                  <div
                    key={d.courseId}
                    className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {d.courseCode} - {d.title}
                    </span>
                    <span className="tabular-nums font-medium">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/80 shadow-soft-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-title">
                  <GraduationCap className="size-4 text-primary" aria-hidden />
                  Department distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.byDepartment.map((d) => (
                  <div
                    key={d.departmentId ?? 'none'}
                    className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm"
                  >
                    <span>{d.label}</span>
                    <span className="tabular-nums font-medium">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DashboardPage>
    </PermissionGate>
  );
}
