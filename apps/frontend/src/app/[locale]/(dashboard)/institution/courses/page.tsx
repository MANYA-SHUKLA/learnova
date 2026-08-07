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
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Download,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  EmptyState,
  ErrorState,
} from '@/features/institution';
import {
  formatCourseCategory,
  formatCourseDifficulty,
  formatCourseStatus,
  formatCourseVisibility,
  useArchiveCourseMutation,
  useBulkArchiveCourseMutation,
  useBulkPublishCourseMutation,
  useBulkUnpublishCourseMutation,
  useCourseList,
  useCourseStats,
  useRestoreCourseMutation,
} from '@/features/course';
import type { CourseStatus } from '@/features/course';
import { Link } from '@/lib/i18n/routing';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<CourseStatus | 'all'> = [
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
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      includeDeleted: includeDeleted || status === 'archived',
      page,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search, status, includeDeleted, page],
  );

  const listQuery = useCourseList(params);
  const statsQuery = useCourseStats();
  const archiveMutation = useArchiveCourseMutation();
  const restoreMutation = useRestoreCourseMutation();
  const bulkArchive = useBulkArchiveCourseMutation();
  const bulkPublish = useBulkPublishCourseMutation();
  const bulkUnpublish = useBulkUnpublishCourseMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;

  const toggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const downloadExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const token = getAccessToken();
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/courses/export?format=${format}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-export.${format === 'excel' ? 'xls' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.INSTITUTION_COURSES_IMPORT}>
                <Upload className="size-4" />
                {tCommon('import')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.INSTITUTION_COURSES_EXPORT}>
                <Download className="size-4" />
                {tCommon('export')}
              </Link>
            </Button>
            <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
              <Button asChild>
                <Link href={APP_ROUTES.INSTITUTION_COURSES_CREATE}>
                  <Plus className="size-4" />
                  {t('addCourse')}
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {statsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-3 h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : [
                { label: t('stats.total'), value: stats?.total ?? 0 },
                { label: t('stats.published'), value: stats?.published ?? 0 },
                { label: t('stats.draft'), value: stats?.draft ?? 0 },
                { label: t('stats.review'), value: stats?.review ?? 0 },
                { label: t('stats.archived'), value: stats?.archived ?? 0 },
                { label: t('stats.programs'), value: stats?.programs ?? 0 },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="rounded-2xl border-border/80">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                        {card.value.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('catalog')}</CardTitle>
            <CardDescription>{t('catalogDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('searchPlaceholder')}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSearch(q);
                  }}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setSearch(q)}>
                  {tCommon('search')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
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
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((st) => (
                <Button
                  key={st}
                  type="button"
                  variant={status === st ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatus(st);
                    setPage(1);
                  }}
                >
                  {st === 'all' ? tCommon('all') : formatCourseStatus(st as CourseStatus)}
                </Button>
              ))}
            </div>

            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium">
                  {t('bulkSelected', { count: selected.length })}
                </p>
                <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={bulkPublish.isPending}
                    onClick={() => {
                      void bulkPublish.mutateAsync(selected).then(() => setSelected([]));
                    }}
                  >
                    {t('bulkPublish')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={bulkUnpublish.isPending}
                    onClick={() => {
                      void bulkUnpublish.mutateAsync(selected).then(() => setSelected([]));
                    }}
                  >
                    {t('bulkUnpublish')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={bulkArchive.isPending}
                    onClick={() => {
                      void bulkArchive.mutateAsync(selected).then(() => setSelected([]));
                    }}
                  >
                    {t('bulkArchive')}
                  </Button>
                </PermissionGate>
              </div>
            ) : null}

            {listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : listQuery.isError ? (
              <ErrorState
                message={listQuery.error instanceof Error ? listQuery.error.message : t('loadError')}
                onRetry={() => void listQuery.refetch()}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                title={t('emptyTitle')}
                description={t('emptyDescription')}
                icon={BookOpen}
                actionLabel={t('addCourse')}
                actionHref={APP_ROUTES.INSTITUTION_COURSES_CREATE}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">
                        <input
                          type="checkbox"
                          checked={selected.length === rows.length && rows.length > 0}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="p-2 text-left font-medium">{t('table.code')}</th>
                      <th className="p-2 text-left font-medium">{t('table.title')}</th>
                      <th className="p-2 text-left font-medium">{t('table.category')}</th>
                      <th className="p-2 text-left font-medium">{t('table.difficulty')}</th>
                      <th className="p-2 text-left font-medium">{t('table.credits')}</th>
                      <th className="p-2 text-left font-medium">{t('table.status')}</th>
                      <th className="p-2 text-left font-medium">{t('table.visibility')}</th>
                      <th className="p-2 text-right font-medium">{tCommon('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleOne(row.id)}
                          />
                        </td>
                        <td className="p-2 font-mono text-xs">{row.courseCode}</td>
                        <td className="p-2 font-medium">{row.title}</td>
                        <td className="p-2 text-muted-foreground">{formatCourseCategory(row.category)}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {formatCourseDifficulty(row.difficulty)}
                          </Badge>
                        </td>
                        <td className="p-2 tabular-nums">{row.credits}</td>
                        <td className="p-2">
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
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {formatCourseVisibility(row.visibility)}
                        </td>
                        <td className="p-2 text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`${APP_ROUTES.INSTITUTION_COURSES}/${row.id}`}>
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {meta && meta.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  {t('pagination.showing', {
                    start: (meta.page - 1) * meta.limit + 1,
                    end: Math.min(meta.page * meta.limit, meta.total),
                    total: meta.total,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!meta.hasPrevPage}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {tCommon('previous')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {tCommon('next')}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
