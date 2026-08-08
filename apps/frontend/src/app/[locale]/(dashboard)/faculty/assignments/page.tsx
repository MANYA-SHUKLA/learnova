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
  StatCard,
  StatGrid,
} from '@learnova/ui';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatAssignmentStatus,
  formatAssignmentType,
  formatDueDate,
  formatSubmissionStatus,
  useAssignmentList,
  useFacultyAssignmentDashboard,
  useGradeSubmissionMutation,
  usePublishAssignmentMutation,
  useSubmissionList,
} from '@/features/assignment';

export default function FacultyAssignmentsPage() {
  const t = useTranslations('dashboard.faculty.assignments');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});

  const params = useMemo(
    () => ({
      q: search || undefined,
      page,
      limit: 20,
      sortBy: 'dueDate',
      sortOrder: 'asc' as const,
    }),
    [search, page],
  );

  const listQuery = useAssignmentList(params);
  const dashQuery = useFacultyAssignmentDashboard();
  const submissionsQuery = useSubmissionList({
    status: 'submitted',
    page: 1,
    limit: 10,
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });
  const lateQuery = useSubmissionList({ late: true, page: 1, limit: 10 });
  const publishMutation = usePublishAssignmentMutation();
  const gradeMutation = useGradeSubmissionMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;
  const pending = submissionsQuery.data?.items ?? [];
  const late = lateQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_READ} enforce>
      <DashboardPage>
        <PageHeader eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />

        <StatGrid className="sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t('stats.created'), value: dash?.assignmentsCreated },
            { label: t('stats.pending'), value: dash?.pendingReviews },
            { label: t('stats.late'), value: dash?.lateSubmissions },
            {
              label: t('stats.avgGrade'),
              value: dash?.averageGrade != null ? dash.averageGrade.toFixed(1) : '—',
            },
            {
              label: t('stats.submissionRate'),
              value: dash ? `${Math.round(dash.submissionRate * 100)}%` : '—',
            },
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
                toolbar={
                  <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                    <Input
                      className="rounded-xl sm:w-56"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSearch(q.trim());
                          setPage(1);
                        }
                      }}
                    />
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
                    cell: (row) => (
                      <span className="text-sm text-muted-foreground">
                        {formatDueDate(row.dueDate)}
                      </span>
                    ),
                  },
                ]}
                rowActions={(row) =>
                  row.status === 'draft' ? (
                    <Button
                      size="sm"
                      className="rounded-lg"
                      disabled={publishMutation.isPending}
                      onClick={() => void publishMutation.mutateAsync(row.id)}
                    >
                      {t('publish')}
                    </Button>
                  ) : null
                }
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.title}</p>
                        <Badge variant="secondary">{formatAssignmentStatus(row.status)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(row.dueDate)}
                      </p>
                      {row.status === 'draft' ? (
                        <Button
                          size="sm"
                          disabled={publishMutation.isPending}
                          onClick={() => void publishMutation.mutateAsync(row.id)}
                        >
                          {t('publish')}
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-xl border-border/80 shadow-soft-md">
            <CardHeader>
              <CardTitle className="text-card-title">{t('pendingTitle')}</CardTitle>
              <CardDescription>{t('pendingDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noPending')}</p>
              ) : (
                pending.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/80 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{formatSubmissionStatus(sub.status)}</Badge>
                      <span className="text-xs text-muted-foreground">#{sub.attemptNumber}</span>
                    </div>
                    <Input
                      type="number"
                      placeholder={t('marksPlaceholder')}
                      value={gradeMarks[sub.id] ?? ''}
                      onChange={(e) =>
                        setGradeMarks((prev) => ({ ...prev, [sub.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={gradeMutation.isPending || !gradeMarks[sub.id]}
                      onClick={() =>
                        void gradeMutation.mutateAsync({
                          id: sub.id,
                          body: {
                            gradingMethod: 'marks',
                            marksObtained: Number(gradeMarks[sub.id]),
                            feedback: 'Graded',
                          },
                        })
                      }
                    >
                      {t('grade')}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/80 shadow-soft-md">
            <CardHeader>
              <CardTitle className="text-card-title">{t('lateTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {late.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noLate')}</p>
              ) : (
                late.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{sub.assignmentId}</span>
                    <Badge variant="danger">{t('late')}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardPage>
    </PermissionGate>
  );
}
