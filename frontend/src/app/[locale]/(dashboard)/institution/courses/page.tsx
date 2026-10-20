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
import { ArrowRight, Download, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatCourseCategory,
  formatCourseDifficulty,
  formatCourseStatus,
  formatCourseVisibility,
  useArchiveCourseMutation,
  useBulkArchiveCourseMutation,
  useBulkPublishCourseMutation,
  useBulkUnpublishCourseMutation,
  useRestoreCourseMutation,
  courseKeys,
  useCourseStats,
} from '@/features/course';
import { courseApi } from '@/features/course/services/course-api';
import { fetchAllListPages } from '@/lib/api/fetch-all-pages';
import type { CourseStatus } from '@/features/course';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const TABLE_PAGE_SIZE = 50;

const STATUS_FILTERS: (CourseStatus | 'all')[] = [
  'all',
  'draft',
  'review',
  'published',
  'scheduled',
  'archived',
];

export default function CourseListPage() {
  const t = useTranslations('dashboard.institution.courses');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CourseStatus | 'all'>('published');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const listFilters = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      /** Include soft-deleted rows for All + Archived so archived catalog rows are visible. */
      ...(status === 'all' || status === 'archived' ? { includeDeleted: true as const } : {}),
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search, status],
  );

  const listQuery = useQuery({
    queryKey: [...courseKeys.list(listFilters), 'directory'] as const,
    queryFn: () =>
      fetchAllListPages((p, limit) =>
        courseApi.list({ ...listFilters, page: p, limit }),
      ),
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
  const statsQuery = useCourseStats();
  const bulkArchive = useBulkArchiveCourseMutation();
  const bulkPublish = useBulkPublishCourseMutation();
  const bulkUnpublish = useBulkUnpublishCourseMutation();
  const archiveMutation = useArchiveCourseMutation();
  const restoreMutation = useRestoreCourseMutation();

  const rows = listQuery.data?.items ?? [];
  const catalogTotal = listQuery.isSuccess ? rows.length : (statsQuery.data?.total ?? 0);
  const activeCatalogTotal = statsQuery.data?.total ?? 0;
  const tableTotalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
  const tablePage = Math.min(page, tableTotalPages);
  const pagedRows = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE;
    return rows.slice(start, start + TABLE_PAGE_SIZE);
  }, [rows, tablePage]);

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_READ} enforce>
      <DashboardPage>
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          actions={
            <>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_COURSES_IMPORT}>
                  <Upload className="size-4" />
                  {tCommon('import')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_COURSES_EXPORT}>
                  <Download className="size-4" />
                  {tCommon('export')}
                </Link>
              </Button>
              <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
                <Button asChild className="rounded-xl">
                  <Link href={APP_ROUTES.INSTITUTION_COURSES_CREATE}>
                    <Plus className="size-4" />
                    {t('addCourse')}
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
                { label: t('stats.total'), value: statsQuery.data?.total ?? 0 },
                { label: t('stats.published'), value: statsQuery.data?.published ?? 0 },
                { label: t('stats.draft'), value: statsQuery.data?.draft ?? 0 },
                { label: t('stats.review'), value: statsQuery.data?.review ?? 0 },
                { label: t('stats.archived'), value: statsQuery.data?.archived ?? 0 },
                { label: t('stats.programs'), value: statsQuery.data?.programs ?? 0 },
              ].map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value.toLocaleString()}
                  accent="primary"
                />
              ))}
        </StatGrid>

        <Card directory>
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('catalog')}</CardTitle>
            <CardDescription>
              {listQuery.isSuccess && catalogTotal > 0
                ? status === 'all'
                  ? t('showingAllWithArchived', {
                      count: catalogTotal,
                      active: activeCatalogTotal,
                      archived: statsQuery.data?.archived ?? 0,
                    })
                  : status === 'published'
                    ? t('showingPublished', { count: catalogTotal })
                    : t('showingFiltered', { count: catalogTotal })
                : t('catalogDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listQuery.isError ? (
              <ErrorState
                message={listQuery.error instanceof Error ? listQuery.error.message : t('loadError')}
                onRetry={() => void listQuery.refetch()}
              />
            ) : (
              <DataTable
                caption={t('catalog')}
                loading={listQuery.isLoading}
                data={pagedRows}
                rowKey={(row) => row.id}
                selectable
                selectedIds={selected}
                onSelectionChange={setSelected}
                bulkActions={
                  <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={bulkPublish.isPending}
                      onClick={() => void bulkPublish.mutateAsync(selected).then(() => { setSelected([]); })}
                    >
                      {t('bulkPublish')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={bulkUnpublish.isPending}
                      onClick={() => void bulkUnpublish.mutateAsync(selected).then(() => { setSelected([]); })}
                    >
                      {t('bulkUnpublish')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="rounded-xl"
                      disabled={bulkArchive.isPending}
                      onClick={() => void bulkArchive.mutateAsync(selected).then(() => { setSelected([]); })}
                    >
                      {t('bulkArchive')}
                    </Button>
                  </PermissionGate>
                }
                filters={
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatus(st);
                          setPage(1);
                          setSelected([]);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          status === st
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted/60',
                        )}
                      >
                        {st === 'all' ? tCommon('all') : formatCourseStatus(st)}
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
                        onChange={(e) => { setQ(e.target.value); }}
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
                      {tCommon('search')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setQ('');
                        setSearch('');
                        setStatus('published');
                        setPage(1);
                        setSelected([]);
                      }}
                    >
                      {tCommon('clear')}
                    </Button>
                  </div>
                }
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                pagination={
                  rows.length > TABLE_PAGE_SIZE
                    ? {
                        page: tablePage,
                        totalPages: tableTotalPages,
                        total: rows.length,
                        hasNextPage: tablePage < tableTotalPages,
                        hasPrevPage: tablePage > 1,
                        onPageChange: setPage,
                      }
                    : rows.length > 0
                      ? {
                          page: 1,
                          totalPages: 1,
                          total: rows.length,
                          hasNextPage: false,
                          hasPrevPage: false,
                          onPageChange: setPage,
                        }
                      : undefined
                }
                emptyAction={
                  <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
                    <Button asChild className="rounded-xl">
                      <Link href={APP_ROUTES.INSTITUTION_COURSES_CREATE}>{t('addCourse')}</Link>
                    </Button>
                  </PermissionGate>
                }
                columns={[
                  {
                    id: 'code',
                    header: t('table.code'),
                    sortable: true,
                    sortValue: (row) => row.courseCode,
                    cell: (row) => <span className="font-mono text-xs">{row.courseCode}</span>,
                  },
                  {
                    id: 'title',
                    header: t('table.title'),
                    sortable: true,
                    sortValue: (row) => row.title,
                    cell: (row) => (
                      <Link
                        href={`${APP_ROUTES.INSTITUTION_COURSES}/${row.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {row.title}
                      </Link>
                    ),
                  },
                  {
                    id: 'category',
                    header: t('table.category'),
                    cell: (row) => (
                      <span className="text-muted-foreground">{formatCourseCategory(row.category)}</span>
                    ),
                  },
                  {
                    id: 'difficulty',
                    header: t('table.difficulty'),
                    cell: (row) => (
                      <Badge variant="outline" className="text-xs">
                        {formatCourseDifficulty(row.difficulty)}
                      </Badge>
                    ),
                  },
                  {
                    id: 'credits',
                    header: t('table.credits'),
                    cell: (row) => <span className="tabular-nums">{row.credits}</span>,
                  },
                  {
                    id: 'status',
                    header: t('table.status'),
                    cell: (row) => (
                      <Badge
                        variant={
                          row.status === 'published'
                            ? 'default'
                            : row.status === 'draft'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {formatCourseStatus(row.status)}
                      </Badge>
                    ),
                  },
                  {
                    id: 'visibility',
                    header: t('table.visibility'),
                    cell: (row) => (
                      <span className="text-xs text-muted-foreground">
                        {formatCourseVisibility(row.visibility)}
                      </span>
                    ),
                  },
                ]}
                rowActions={(row) => (
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button asChild size="sm" variant="ghost" className="rounded-lg">
                      <Link href={`${APP_ROUTES.INSTITUTION_COURSES}/${row.id}`}>
                        {tCommon('view')}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
                      {row.deletedAt || row.status === 'archived' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={restoreMutation.isPending}
                          onClick={() => void restoreMutation.mutateAsync(row.id)}
                        >
                          <RotateCcw className="size-3.5" />
                          {t('restore')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-danger hover:text-danger"
                          disabled={archiveMutation.isPending}
                          onClick={() => {
                            if (window.confirm(t('confirmArchive'))) {
                              void archiveMutation.mutateAsync(row.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          {t('archive')}
                        </Button>
                      )}
                    </PermissionGate>
                  </div>
                )}
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.title}</p>
                          <p className="font-mono text-xs text-muted-foreground">{row.courseCode}</p>
                        </div>
                        <Badge variant="secondary">{formatCourseStatus(row.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCourseCategory(row.category)} · {row.credits} credits
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                        <Link href={`${APP_ROUTES.INSTITUTION_COURSES}/${row.id}`}>
                          {tCommon('view')}
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
