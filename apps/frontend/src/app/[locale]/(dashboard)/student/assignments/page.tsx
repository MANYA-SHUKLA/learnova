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
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
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
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t('stats.upcoming'), value: dash?.upcoming },
            { label: t('stats.submitted'), value: dash?.submitted },
            { label: t('stats.pending'), value: dash?.pending },
            { label: t('stats.late'), value: dash?.late },
            { label: t('stats.grades'), value: dash?.gradesReceived },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-border/80">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (stat.value ?? '—')}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('listTitle')}</CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {listQuery.isError ? (
              <ErrorState message={t('error')} />
            ) : listQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : rows.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.title}</p>
                        <Badge variant="secondary">{formatAssignmentStatus(row.status)}</Badge>
                        <Badge variant="outline">{formatAssignmentType(row.assignmentType)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(row.dueDate)} · {row.totalMarks} {t('marks')}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`${APP_ROUTES.STUDENT_ASSIGNMENTS}/${row.id}`}>
                        {t('open')}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
