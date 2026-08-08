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
import {
  ArrowRight,
  Download,
  Plus,
  Search,
  Upload,
  UserRound,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  ErrorState,
} from '@/features/institution';
import {
  formatStudentStatus,
  useArchiveStudentMutation,
  useBulkActivateStudentMutation,
  useBulkArchiveStudentMutation,
  useBulkSuspendStudentMutation,
  useRestoreStudentMutation,
  useStudentList,
  useStudentStats,
} from '@/features/student';
import type { StudentStatus } from '@/features/student';
import { Link } from '@/lib/i18n/routing';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<StudentStatus | 'all'> = [
  'all',
  'active',
  'inactive',
  'suspended',
  'graduated',
  'dropped',
  'archived',
];

export default function StudentListPage() {
  const t = useTranslations('dashboard.institution.students');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      includeDeleted: includeDeleted || status === 'archived',
      page,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search, status, includeDeleted, page],
  );

  const listQuery = useStudentList(params);
  const statsQuery = useStudentStats();
  const archiveMutation = useArchiveStudentMutation();
  const restoreMutation = useRestoreStudentMutation();
  const bulkArchive = useBulkArchiveStudentMutation();
  const bulkActivate = useBulkActivateStudentMutation();
  const bulkSuspend = useBulkSuspendStudentMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;

  const downloadExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const token = getAccessToken();
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/students/export?format=${format}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export.${format === 'excel' ? 'xls' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_READ} enforce>
      <div className="space-y-8">
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          actions={
            <>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_STUDENTS_IMPORT}>
                  <Upload className="size-4" />
                  {tCommon('import')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_STUDENTS_EXPORT}>
                  <Download className="size-4" />
                  {tCommon('export')}
                </Link>
              </Button>
              <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE}>
                <Button asChild className="rounded-xl">
                  <Link href={APP_ROUTES.INSTITUTION_STUDENTS_CREATE}>
                    <Plus className="size-4" />
                    {t('addStudent')}
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
                { label: t('stats.graduated'), value: stats?.graduated ?? 0 },
                { label: t('stats.dropped'), value: stats?.dropped ?? 0 },
                { label: t('stats.departments'), value: stats?.departments ?? 0 },
                { label: t('stats.newThisMonth'), value: stats?.newThisMonth ?? 0 },
              ].map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value.toLocaleString()}
                  accent="primary"
                />
              ))}
        </StatGrid>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('directory')}</CardTitle>
            <CardDescription>{t('directoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listQuery.isError ? (
              <ErrorState
                message={
                  listQuery.error instanceof Error
                    ? listQuery.error.message
                    : 'Failed to load students.'
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
                    <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={bulkActivate.isPending}
                        onClick={() => void bulkActivate.mutateAsync(selected).then(() => setSelected([]))}
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={bulkSuspend.isPending}
                        onClick={() => void bulkSuspend.mutateAsync(selected).then(() => setSelected([]))}
                      >
                        Suspend
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="rounded-xl"
                        disabled={bulkArchive.isPending}
                        onClick={() => void bulkArchive.mutateAsync(selected).then(() => setSelected([]))}
                      >
                        Archive
                      </Button>
                    </PermissionGate>
                    <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => void downloadExport('csv')}>
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
                          setIncludeDeleted(s === 'archived');
                          setPage(1);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          status === s
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted/60',
                        )}
                      >
                        {s === 'all' ? 'All' : formatStudentStatus(s)}
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
                      Search
                    </Button>
                  </div>
                }
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                emptyAction={
                  <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE}>
                    <Button asChild className="rounded-xl">
                      <Link href={APP_ROUTES.INSTITUTION_STUDENTS_CREATE}>{t('addStudent')}</Link>
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
                    id: 'student',
                    header: 'Student',
                    sortable: true,
                    sortValue: (row) => row.fullName,
                    cell: (row) => (
                      <Link
                        href={`${APP_ROUTES.INSTITUTION_STUDENTS}/${row.id}`}
                        className="flex items-center gap-3 font-medium hover:text-primary"
                      >
                        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {row.profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.profilePhoto} alt="" className="size-9 rounded-xl object-cover" />
                          ) : (
                            <UserRound className="size-4" />
                          )}
                        </span>
                        <span>
                          <span className="block">{row.fullName}</span>
                          <span className="block text-xs font-normal text-muted-foreground">{row.email}</span>
                        </span>
                      </Link>
                    ),
                  },
                  {
                    id: 'studentId',
                    header: 'Student ID',
                    sortable: true,
                    sortValue: (row) => row.studentId,
                    cell: (row) => <span className="tabular-nums">{row.studentId}</span>,
                  },
                  {
                    id: 'roll',
                    header: 'Roll number',
                    cell: (row) => row.rollNumber ?? '—',
                  },
                  {
                    id: 'program',
                    header: 'Program',
                    cell: (row) => row.programId ?? '—',
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => <Badge variant="secondary">{formatStudentStatus(row.status)}</Badge>,
                  },
                ]}
                rowActions={(row) => (
                  <>
                    <Button asChild size="sm" variant="ghost" className="rounded-lg">
                      <Link href={`${APP_ROUTES.INSTITUTION_STUDENTS}/${row.id}`}>View</Link>
                    </Button>
                    <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE}>
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
                          Archive
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
                          <p className="font-medium">{row.fullName}</p>
                          <p className="text-xs text-muted-foreground">{row.email}</p>
                        </div>
                        <Badge variant="secondary">{formatStudentStatus(row.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.studentId} · {row.rollNumber ?? 'No roll'}
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                        <Link href={`${APP_ROUTES.INSTITUTION_STUDENTS}/${row.id}`}>
                          Open profile
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

        {stats && (stats.byDepartment.length > 0 || stats.byProgram.length > 0) ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
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
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Program distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.byProgram.map((d) => (
                  <div
                    key={d.programId ?? 'none'}
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

        {stats?.recentAdmissions && stats.recentAdmissions.length > 0 ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Recent admissions</CardTitle>
              <CardDescription>Newest students by admission date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.recentAdmissions.map((row) => (
                <Link
                  key={row.id}
                  href={`${APP_ROUTES.INSTITUTION_STUDENTS}/${row.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="font-medium">{row.fullName}</span>
                    <span className="ml-2 text-muted-foreground">{row.studentId}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.admissionDate?.slice(0, 10) ?? '—'}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PermissionGate>
  );
}
