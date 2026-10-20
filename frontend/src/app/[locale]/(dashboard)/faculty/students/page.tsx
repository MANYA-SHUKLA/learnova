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
import { Link } from '@/lib/i18n/routing';

export default function FacultyStudentDirectoryPage() {
  const t = useTranslations('dashboard.faculty.students');
  const tInst = useTranslations('dashboard.institution.students');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const listFilters = useMemo(
    () => ({
      q: search || undefined,
      sortBy: 'fullName',
      sortOrder: 'asc' as const,
    }),
    [search],
  );

  const labels = useOrgLabels();
  const listQuery = useQuery({
    queryKey: [...studentKeys.list(listFilters), 'faculty-directory'] as const,
    queryFn: () =>
      fetchAllListPages((p, limit) => studentApi.list({ ...listFilters, page: p, limit })),
    staleTime: 30_000,
  });

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;

  const runSearch = () => {
    setSearch(q.trim());
  };

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_READ} enforce>
      <DashboardPage>
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          actions={
            <Button type="button" className="rounded-xl" onClick={runSearch}>
              <Search className="size-4" />
              {t('searchAction')}
            </Button>
          }
        />

        <Card className="directory-shell">
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-card-title">{t('directory')}</CardTitle>
              <CardDescription>
                {listQuery.isSuccess && total > 0
                  ? tInst('showingAll', { count: total })
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
                className="[&_.card-static]:max-h-[min(70vh,56rem)] [&_.card-static>.overflow-x-auto]:max-h-[min(65vh,52rem)] [&_.card-static>.overflow-x-auto]:overflow-y-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
                loading={listQuery.isLoading}
                data={rows}
                rowKey={(row) => row.id}
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
