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
} from '@learnova/ui';
import { Search, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState, useOrgLabels } from '@/features/institution';
import { formatStudentStatus, studentKeys } from '@/features/student';
import { studentApi } from '@/features/student/services/student-api';
import { fetchAllListPages } from '@/lib/api/fetch-all-pages';
import type { StudentStatus } from '@/features/student';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const TABLE_PAGE_SIZE = 50;

const STATUS_FILTERS: (StudentStatus | 'all')[] = [
  'all',
  'active',
  'inactive',
  'suspended',
  'graduated',
  'dropped',
  'archived',
];

export default function FacultyStudentDirectoryPage() {
  const t = useTranslations('dashboard.faculty.students');
  const tInst = useTranslations('dashboard.institution.students');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const listFilters = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      ...(status === 'archived' ? { includeDeleted: true as const } : {}),
      sortBy: 'fullName',
      sortOrder: 'asc' as const,
    }),
    [search, status],
  );

  const labels = useOrgLabels();
  const listQuery = useQuery({
    queryKey: [...studentKeys.list(listFilters), 'faculty-directory'] as const,
    queryFn: () =>
      fetchAllListPages((p, limit) => studentApi.list({ ...listFilters, page: p, limit })),
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  const rows = listQuery.data?.items ?? [];
  const directoryTotal = listQuery.data?.total ?? 0;
  const tableTotalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
  const tablePage = Math.min(page, tableTotalPages);
  const pagedRows = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE;
    return rows.slice(start, start + TABLE_PAGE_SIZE);
  }, [rows, tablePage]);

  const runSearch = () => {
    setSearch(q.trim());
    setPage(1);
  };

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_READ} enforce>
      <DashboardPage>
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Card directory>
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-card-title">{t('directory')}</CardTitle>
              <CardDescription>
                {listQuery.isSuccess && directoryTotal > 0
                  ? t('showingAll', { count: directoryTotal })
                  : t('directoryDescription')}
              </CardDescription>
            </div>
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
                data={pagedRows}
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
                        {s === 'all' ? 'All' : formatStudentStatus(s)}
                      </button>
                    ))}
                  </div>
                }
                toolbar={
                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <div className="relative min-w-0 flex-1 sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="rounded-xl pl-9"
                        placeholder={t('searchPlaceholder')}
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') runSearch();
                        }}
                      />
                    </div>
                    <Button type="button" variant="secondary" className="rounded-xl" onClick={runSearch}>
                      {t('searchAction')}
                    </Button>
                  </div>
                }
                pagination={
                  rows.length > 0
                    ? {
                        page: tablePage,
                        totalPages: tableTotalPages,
                        total: rows.length,
                        hasNextPage: tablePage < tableTotalPages,
                        hasPrevPage: tablePage > 1,
                        onPageChange: setPage,
                      }
                    : undefined
                }
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                columns={[
                  {
                    id: 'student',
                    header: 'Student',
                    sortable: true,
                    sortValue: (row) => row.fullName,
                    cell: (row) => (
                      <Link
                        href={`${APP_ROUTES.FACULTY_STUDENTS}/${row.id}`}
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
                    cell: (row) => <span className="tabular-nums">{row.studentId}</span>,
                  },
                  {
                    id: 'branch',
                    header: tInst('columns.branch'),
                    cell: (row) => (
                      <span className="text-sm">
                        {row.programId ? labels.program(row.programId) : tInst('columns.unassigned')}
                      </span>
                    ),
                  },
                  {
                    id: 'yearOfStudy',
                    header: tInst('columns.yearOfStudy'),
                    cell: (row) =>
                      row.yearOfStudy != null ? (
                        <span className="tabular-nums">Year {row.yearOfStudy}</span>
                      ) : (
                        tInst('columns.unassigned')
                      ),
                  },
                  {
                    id: 'semester',
                    header: 'Sem',
                    cell: (row) => {
                      if (row.currentSemester != null) {
                        return <span className="tabular-nums">Sem {row.currentSemester}</span>;
                      }
                      const term = labels.semester(row.semesterId);
                      return term && term !== '—' ? term : tInst('columns.unassigned');
                    },
                  },
                  {
                    id: 'batch',
                    header: 'Batch',
                    cell: (row) => labels.batch(row.batchId) || tInst('columns.unassigned'),
                  },
                  {
                    id: 'section',
                    header: 'Section',
                    cell: (row) => labels.section(row.sectionId) || tInst('columns.unassigned'),
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => (
                      <Badge variant="secondary">{formatStudentStatus(row.status)}</Badge>
                    ),
                  },
                ]}
                rowActions={(row) => (
                  <Button asChild size="sm" variant="ghost" className="rounded-lg">
                    <Link href={`${APP_ROUTES.FACULTY_STUDENTS}/${row.id}`}>{t('viewProfile')}</Link>
                  </Button>
                )}
              />
            )}
          </CardContent>
        </Card>
      </DashboardPage>
    </PermissionGate>
  );
}
