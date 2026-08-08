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
import { ClipboardCheck, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatAssignmentStatus,
  formatAssignmentType,
  formatDueDate,
  useArchiveAssignmentMutation,
  useAssignmentList,
  useCloseAssignmentMutation,
  useInstitutionAssignmentDashboard,
  usePublishAssignmentMutation,
} from '@/features/assignment';
import type { AssignmentStatus } from '@/features/assignment';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: (AssignmentStatus | 'all')[] = [
  'all',
  'draft',
  'published',
  'closed',
  'archived',
];

export default function InstitutionAssignmentsPage() {
  const t = useTranslations('dashboard.institution.assignments');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AssignmentStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search, status, page],
  );

  const listQuery = useAssignmentList(params);
  const dashQuery = useInstitutionAssignmentDashboard();
  const publishMutation = usePublishAssignmentMutation();
  const archiveMutation = useArchiveAssignmentMutation();
  const closeMutation = useCloseAssignmentMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_READ} enforce>
      <DashboardPage>
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <StatGrid className="sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t('stats.total'), value: dash?.totalAssignments },
            { label: t('stats.published'), value: dash?.published },
            {
              label: t('stats.submissionRate'),
              value: dash ? `${Math.round(dash.submissionRate * 100)}%` : undefined,
            },
            { label: t('stats.avgGrade'), value: dash?.averageGrade?.toFixed(1) ?? '—' },
          ].map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value ?? '—'}
              loading={dashQuery.isLoading}
              accent="primary"
            />
          ))}
        </StatGrid>

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('listTitle')}</CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listQuery.isError ? (
              <ErrorState message={t('error')} onRetry={() => void listQuery.refetch()} />
            ) : (
              <DataTable
                caption={t('listTitle')}
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
                        {s === 'all' ? t('filters.all') : formatAssignmentStatus(s)}
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
                        value={q}
                        onChange={(e) => { setQ(e.target.value); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSearch(q.trim());
                            setPage(1);
                          }
                        }}
                        placeholder={t('searchPlaceholder')}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => {
                        setSearch(q.trim());
                        setPage(1);
                      }}
                    >
                      {t('search')}
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
                    id: 'title',
                    header: t('listTitle'),
                    sortable: true,
                    sortValue: (row) => row.title,
                    cell: (row) => <span className="font-medium">{row.title}</span>,
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => (
                      <Badge variant="secondary">{formatAssignmentStatus(row.status)}</Badge>
                    ),
                  },
                  {
                    id: 'type',
                    header: 'Type',
                    cell: (row) => (
                      <Badge variant="outline">{formatAssignmentType(row.assignmentType)}</Badge>
                    ),
                  },
                  {
                    id: 'due',
                    header: t('due'),
                    sortable: true,
                    sortValue: (row) => row.dueDate ?? '',
                    cell: (row) => (
                      <span className="text-sm text-muted-foreground">
                        {formatDueDate(row.dueDate)}
                      </span>
                    ),
                  },
                  {
                    id: 'marks',
                    header: t('marks'),
                    cell: (row) => <span className="tabular-nums">{row.totalMarks}</span>,
                  },
                ]}
                rowActions={(row) => (
                  <>
                    {row.status === 'draft' ? (
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={publishMutation.isPending}
                        onClick={() => void publishMutation.mutateAsync(row.id)}
                      >
                        {t('publish')}
                      </Button>
                    ) : null}
                    {row.status === 'published' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={closeMutation.isPending}
                        onClick={() => void closeMutation.mutateAsync(row.id)}
                      >
                        {t('close')}
                      </Button>
                    ) : null}
                    {row.status !== 'archived' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                        disabled={archiveMutation.isPending}
                        onClick={() => void archiveMutation.mutateAsync(row.id)}
                      >
                        {t('archive')}
                      </Button>
                    ) : null}
                  </>
                )}
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.title}</p>
                        <Badge variant="secondary">{formatAssignmentStatus(row.status)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(row.dueDate)} · {row.totalMarks} {t('marks')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {row.status === 'draft' ? (
                          <Button
                            size="sm"
                            disabled={publishMutation.isPending}
                            onClick={() => void publishMutation.mutateAsync(row.id)}
                          >
                            {t('publish')}
                          </Button>
                        ) : null}
                        {row.status === 'published' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={closeMutation.isPending}
                            onClick={() => void closeMutation.mutateAsync(row.id)}
                          >
                            {t('close')}
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </CardContent>
        </Card>

        {dash?.byDepartment?.length ? (
          <Card className="rounded-xl border-border/80 shadow-soft-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-title">
                <ClipboardCheck className="size-4" aria-hidden />
                {t('departmentComparison')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dash.byDepartment.slice(0, 8).map((d) => (
                <div key={d.departmentId ?? d.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium tabular-nums">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <p className="text-caption">
          <Link href={APP_ROUTES.FACULTY_ASSIGNMENTS} className="underline-offset-2 hover:underline">
            {t('facultyLink')}
          </Link>
        </p>
      </DashboardPage>
    </PermissionGate>
  );
}
