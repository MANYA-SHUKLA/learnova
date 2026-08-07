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
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatProjectStatus,
  formatProjectType,
  formatSubmissionStatus,
  useFacultyProjectDashboard,
  useGradeSubmissionMutation,
  useProjectList,
  usePublishProjectMutation,
  useSubmissionList,
} from '@/features/project';
import { Link } from '@/lib/i18n/routing';

export default function FacultyProjectsPage() {
  const t = useTranslations('dashboard.faculty.projects');
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

  const listQuery = useProjectList(params);
  const dashQuery = useFacultyProjectDashboard();
  const submissionsQuery = useSubmissionList({
    status: 'submitted',
    page: 1,
    limit: 10,
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });
  const pendingReviewsQuery = useSubmissionList({
    graded: false,
    status: 'submitted',
    page: 1,
    limit: 10,
  });
  const publishMutation = usePublishProjectMutation();
  const gradeMutation = useGradeSubmissionMutation();

  const rows = listQuery.data?.items ?? [];
  const dash = dashQuery.data;
  const pending = submissionsQuery.data?.items ?? [];
  const pendingReviews = pendingReviewsQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
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
            { label: t('stats.created'), value: dash?.projectsCreated },
            { label: t('stats.teams'), value: dash?.activeTeams },
            { label: t('stats.pendingReviews'), value: dash?.pendingReviews },
            { label: t('stats.pendingGrades'), value: dash?.pendingGrades },
            {
              label: t('stats.submissionRate'),
              value: dash ? `${Math.round(dash.submissionRate * 100)}%` : '—',
            },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-border/80">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (stat.value ?? '—')}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('listTitle')}</CardTitle>
              <CardDescription>{t('listDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                className="sm:w-56"
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
                variant="outline"
                onClick={() => {
                  setSearch(q.trim());
                  setPage(1);
                }}
              >
                {t('search')}
              </Button>
            </div>
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
                        <Badge variant="secondary">{formatProjectStatus(row.status)}</Badge>
                        <Badge variant="outline">{formatProjectType(row.projectType)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(row.dueDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${APP_ROUTES.FACULTY_PROJECTS}/${row.id}`}>
                          {t('manage')}
                        </Link>
                      </Button>
                      {row.status === 'draft' ? (
                        <Button
                          size="sm"
                          disabled={publishMutation.isPending}
                          onClick={() => void publishMutation.mutateAsync(row.id)}
                        >
                          {t('publish')}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('pendingTitle')}</CardTitle>
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

          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('reviewsTitle')}</CardTitle>
              <CardDescription>{t('reviewsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noReviews')}</p>
              ) : (
                pendingReviews.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{sub.projectId}</span>
                    <Badge variant="outline">{formatSubmissionStatus(sub.status)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
