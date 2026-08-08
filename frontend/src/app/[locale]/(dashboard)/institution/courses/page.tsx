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
import { ArrowRight, Download, Plus, Search, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage } from '@/components/dashboard';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatCourseCategory,
  formatCourseDifficulty,
  formatCourseStatus,
  formatCourseVisibility,
  useBulkArchiveCourseMutation,
  useBulkPublishCourseMutation,
  useBulkUnpublishCourseMutation,
  useCourseList,
  useCourseStats,
} from '@/features/course';
import type { CourseStatus } from '@/features/course';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

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
  const [status, setStatus] = useState<CourseStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      includeDeleted: status === 'archived',
      page,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search, status, page],
  );

  const listQuery = useCourseList(params);
  const statsQuery = useCourseStats();
  const bulkArchive = useBulkArchiveCourseMutation();
  const bulkPublish = useBulkPublishCourseMutation();
  const bulkUnpublish = useBulkUnpublishCourseMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;

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
                { label: t('stats.total'), value: stats?.total ?? 0 },
                { label: t('stats.published'), value: stats?.published ?? 0 },
                { label: t('stats.draft'), value: stats?.draft ?? 0 },
                { label: t('stats.review'), value: stats?.review ?? 0 },
                { label: t('stats.archived'), value: stats?.archived ?? 0 },
                { label: t('stats.programs'), value: stats?.programs ?? 0 },
              ].map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value.toLocaleString()}
                  accent="primary"
                />
              ))}
        </StatGrid>

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('catalog')}</CardTitle>
            <CardDescription>{t('catalogDescription')}</CardDescription>
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
                data={rows}
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
                        setStatus('all');
                        setPage(1);
                      }}
                    >
                      {tCommon('clear')}
                    </Button>
                  </div>
                }
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                emptyAction={
                  <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
                    <Button asChild className="rounded-xl">
                      <Link href={APP_ROUTES.INSTITUTION_COURSES_CREATE}>{t('addCourse')}</Link>
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
                  <Button asChild size="sm" variant="ghost" className="rounded-lg">
                    <Link href={`${APP_ROUTES.INSTITUTION_COURSES}/${row.id}`}>
                      {tCommon('view')}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
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
