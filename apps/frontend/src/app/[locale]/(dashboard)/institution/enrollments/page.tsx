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
  Input,
  Skeleton,
} from '@learnova/ui';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Download,
  GraduationCap,
  Plus,
  Search,
  Upload,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
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
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      includeDeleted,
      page,
      limit: 20,
      sortBy: 'enrollmentDate',
      sortOrder: 'desc' as const,
    }),
    [search, status, includeDeleted, page],
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

  const toggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

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
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_IMPORT}>
                <Upload className="size-4" />
                {tCommon('import')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_EXPORT}>
                <Download className="size-4" />
                {tCommon('export')}
              </Link>
            </Button>
            <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
              <Button asChild>
                <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_CREATE}>
                  <Plus className="size-4" />
                  {t('addEnrollment')}
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {statsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-3 h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : [
                { label: t('stats.total'), value: stats?.total ?? 0 },
                { label: t('stats.active'), value: stats?.active ?? 0 },
                { label: t('stats.pending'), value: stats?.pending ?? 0 },
                { label: t('stats.completed'), value: stats?.completed ?? 0 },
                { label: t('stats.withdrawn'), value: stats?.withdrawn ?? 0 },
                { label: t('stats.waitlisted'), value: stats?.waitlisted ?? 0 },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="rounded-2xl border-border/80">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                        {card.value.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

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

            {selected.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                <span className="text-sm text-muted-foreground">{selected.length} selected</span>
                <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                  <Button
                    size="sm"
                    variant="outline"
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
                    disabled={bulkArchive.isPending}
                    onClick={() => void bulkArchive.mutateAsync(selected).then(() => setSelected([]))}
                  >
                    Delete
                  </Button>
                </PermissionGate>
                <Button size="sm" variant="ghost" onClick={() => void downloadExport('csv')}>
                  Export CSV
                </Button>
              </div>
            ) : null}

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
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                illustration="faculty"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
                action={
                  <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                    <Button asChild>
                      <Link href={APP_ROUTES.INSTITUTION_ENROLLMENTS_CREATE}>
                        {t('addEnrollment')}
                      </Link>
                    </Button>
                  </PermissionGate>
                }
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.length === rows.length && rows.length > 0}
                            onChange={toggleAll}
                            aria-label="Select all"
                          />
                        </th>
                        <th className="px-3 py-3">Enrollment #</th>
                        <th className="px-3 py-3">Student</th>
                        <th className="px-3 py-3">Course</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-border/70 hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(row.id)}
                              onChange={() => toggleOne(row.id)}
                              aria-label={`Select ${row.enrollmentNumber}`}
                            />
                          </td>
                          <td className="px-3 py-3 tabular-nums">{row.enrollmentNumber}</td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-2">
                              <UserRound className="size-4 text-muted-foreground" />
                              {row.studentId}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-2">
                              <BookOpen className="size-4 text-muted-foreground" />
                              {row.courseId}
                            </span>
                          </td>
                          <td className="px-3 py-3 tabular-nums">
                            {row.enrollmentDate.slice(0, 10)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="secondary">{formatEnrollmentStatus(row.status)}</Badge>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="inline-flex gap-1">
                              <Button asChild size="sm" variant="ghost">
                                <Link href={`${APP_ROUTES.INSTITUTION_ENROLLMENTS}/${row.id}`}>
                                  View
                                </Link>
                              </Button>
                              <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE}>
                                {row.deletedAt ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={restoreMutation.isPending}
                                    onClick={() => void restoreMutation.mutateAsync(row.id)}
                                  >
                                    Restore
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={archiveMutation.isPending}
                                    onClick={() => void archiveMutation.mutateAsync(row.id)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {rows.map((row) => (
                    <Card key={row.id} className="rounded-2xl">
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
                        <Button asChild size="sm" variant="outline" className="w-full">
                          <Link href={`${APP_ROUTES.INSTITUTION_ENROLLMENTS}/${row.id}`}>
                            View details
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
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

        {stats && (stats.byCourse.length > 0 || stats.byDepartment.length > 0) ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-primary" />
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
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="size-4 text-primary" />
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
      </div>
    </PermissionGate>
  );
}
