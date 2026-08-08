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
  PageHeader,
  StatCard,
  StatGrid,
} from '@learnova/ui';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatAssignmentStatus,
  formatAssignmentType,
  formatDueDate,
  useMyAssignments,
  useStudentAssignmentDashboard,
} from '@/features/assignment';
import { Link } from '@/lib/i18n/routing';

export default function StudentAssignmentsPage() {
  const t = useTranslations('dashboard.student.assignments');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      status: 'published' as const,
      page,
      limit: 20,
      sortBy: 'dueDate',
      sortOrder: 'asc' as const,
    }),
    [page],
  );

  const listQuery = useMyAssignments(params);
  const dashQuery = useStudentAssignmentDashboard();
  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_READ} enforce>
      <DashboardPage>
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <StatGrid className="sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t('stats.upcoming'), value: dash?.upcoming },
            { label: t('stats.submitted'), value: dash?.submitted },
            { label: t('stats.pending'), value: dash?.pending },
            { label: t('stats.late'), value: dash?.late },
            { label: t('stats.grades'), value: dash?.gradesReceived },
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
          <CardContent>
            {listQuery.isError ? (
              <ErrorState message={t('error')} onRetry={() => void listQuery.refetch()} />
            ) : (
              <DataTable
                caption={t('listTitle')}
                loading={listQuery.isLoading}
                data={rows}
                rowKey={(row) => row.id}
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
                    cell: (row) => (
                      <Link
                        href={`${APP_ROUTES.STUDENT_ASSIGNMENTS}/${row.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {row.title}
                      </Link>
                    ),
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
                  <Button asChild size="sm" className="rounded-lg">
                    <Link href={`${APP_ROUTES.STUDENT_ASSIGNMENTS}/${row.id}`}>{t('open')}</Link>
                  </Button>
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
                      <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                        <Link href={`${APP_ROUTES.STUDENT_ASSIGNMENTS}/${row.id}`}>
                          {t('open')}
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
      </DashboardPage>
    </PermissionGate>
  );
}
