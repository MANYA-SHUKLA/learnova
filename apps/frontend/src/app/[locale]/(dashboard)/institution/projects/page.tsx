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
import { FolderKanban, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatProjectStatus,
  formatProjectType,
  useArchiveProjectMutation,
  useCloseProjectMutation,
  useInstitutionProjectDashboard,
  useProjectList,
  usePublishProjectMutation,
} from '@/features/project';
import type { ProjectStatus } from '@/features/project';
import { Link } from '@/lib/i18n/routing';

const STATUS_FILTERS: Array<ProjectStatus | 'all'> = [
  'all',
  'draft',
  'published',
  'closed',
  'archived',
];

export default function InstitutionProjectsPage() {
  const t = useTranslations('dashboard.institution.projects');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
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

  const listQuery = useProjectList(params);
  const dashQuery = useInstitutionProjectDashboard();
  const publishMutation = usePublishProjectMutation();
  const archiveMutation = useArchiveProjectMutation();
  const closeMutation = useCloseProjectMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <Button asChild>
            <Link href={APP_ROUTES.INSTITUTION_PROJECTS_CREATE}>{t('create')}</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t('stats.total'), value: dash?.totalProjects },
            { label: t('stats.published'), value: dash?.published },
            {
              label: t('stats.submissionRate'),
              value: dash ? `${Math.round(dash.submissionRate * 100)}%` : undefined,
            },
            { label: t('stats.avgGrade'), value: dash?.averageGrade?.toFixed(1) ?? '—' },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-border/80">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (stat.value ?? '—')}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('listTitle')}</CardTitle>
              <CardDescription>{t('listDescription')}</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 sm:w-64"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
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
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? 'default' : 'outline'}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                >
                  {s === 'all' ? t('filters.all') : formatProjectStatus(s)}
                </Button>
              ))}
            </div>

            {listQuery.isError ? (
              <ErrorState message={t('error')} />
            ) : listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border/80">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {row.title}
                        </Link>
                        <Badge variant="secondary">{formatProjectStatus(row.status)}</Badge>
                        <Badge variant="outline">{formatProjectType(row.projectType)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(row.dueDate)} · {row.totalMarks} {t('marks')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}>
                          {t('view')}
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
                      {row.status !== 'archived' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={archiveMutation.isPending}
                          onClick={() => void archiveMutation.mutateAsync(row.id)}
                        >
                          {t('archive')}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('previous')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {meta.page} / {meta.totalPages}
                </p>
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

        {dash?.byDepartment?.length ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban className="size-4" />
                {t('departmentComparison')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dash.byDepartment.slice(0, 8).map((d) => (
                <div key={d.departmentId ?? d.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <p className="text-xs text-muted-foreground">
          <Link href={APP_ROUTES.FACULTY_PROJECTS} className="underline-offset-2 hover:underline">
            {t('facultyLink')}
          </Link>
        </p>
      </div>
    </PermissionGate>
  );
}
