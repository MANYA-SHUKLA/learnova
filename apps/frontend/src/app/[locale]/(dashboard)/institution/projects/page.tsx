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
import { SuccessPopup } from '@/components/shared/success-popup';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatProjectDifficulty,
  formatProjectStatus,
  formatProjectType,
  formatSortOption,
  useBulkArchiveProjectsMutation,
  useBulkAssignFacultyMutation,
  useBulkDeleteProjectsMutation,
  useBulkDuplicateProjectsMutation,
  useBulkPublishProjectsMutation,
  useInstitutionProjectDashboard,
  useProjectCategories,
  useProjectList,
  usePublishProjectMutation,
} from '@/features/project';
import type { ProjectDifficulty, ProjectSortOption, ProjectStatus, ProjectTypeSpec } from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

const STATUS_FILTERS: Array<ProjectStatus | 'open' | 'all'> = [
  'all',
  'draft',
  'published',
  'open',
  'closed',
  'archived',
];

const SORT_OPTIONS: ProjectSortOption[] = ['newest', 'oldest', 'deadline', 'title', 'difficulty'];

const DIFFICULTIES: Array<ProjectDifficulty | 'all'> = [
  'all',
  'beginner',
  'intermediate',
  'advanced',
  'expert',
];

export default function InstitutionProjectsPage() {
  const t = useTranslations('dashboard.institution.projects');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'open' | 'all'>('all');
  const [projectType, _setProjectType] = useState<ProjectTypeSpec | 'all'>('all');
  const [difficulty, setDifficulty] = useState<ProjectDifficulty | 'all'>('all');
  const [courseId, setCourseId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [archivedFilter, setArchivedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sort, setSort] = useState<ProjectSortOption>('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignFacultyId, setAssignFacultyId] = useState('');

  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(tCommon('savedSuccessfully'));

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      projectType: projectType === 'all' ? undefined : projectType,
      difficulty: difficulty === 'all' ? undefined : difficulty,
      courseId: courseId || undefined,
      facultyId: facultyId || undefined,
      published: publishedFilter === 'all' ? undefined : publishedFilter === 'yes',
      archived: archivedFilter === 'all' ? undefined : archivedFilter === 'yes',
      sort,
      page,
      limit: 20,
    }),
    [search, status, projectType, difficulty, courseId, facultyId, publishedFilter, archivedFilter, sort, page],
  );

  const listQuery = useProjectList(params);
  const dashQuery = useInstitutionProjectDashboard();
  const categoriesQuery = useProjectCategories();
  const publishMutation = usePublishProjectMutation();
  const bulkPublish = useBulkPublishProjectsMutation();
  const bulkArchive = useBulkArchiveProjectsMutation();
  const bulkDelete = useBulkDeleteProjectsMutation();
  const bulkDuplicate = useBulkDuplicateProjectsMutation();
  const bulkAssignFaculty = useBulkAssignFacultyMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;
  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : rows.map((r) => r.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <div className="space-y-8">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
            <Button asChild>
              <Link href={APP_ROUTES.INSTITUTION_PROJECTS_CREATE}>{t('create')}</Link>
            </Button>
          </PermissionGate>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {[
            { label: t('stats.total'), value: dash?.totalProjects },
            { label: t('stats.published'), value: dash?.published },
            { label: t('stats.active'), value: dash?.active },
            { label: t('stats.completed'), value: dash?.completed },
            { label: t('stats.departments'), value: dash?.departments?.length },
            {
              label: t('stats.submissionRate'),
              value: dash ? `${Math.round((dash.submissionRate ?? 0) * 100)}%` : undefined,
            },
            {
              label: t('stats.facultyParticipation'),
              value: dash?.facultyParticipation != null
                ? `${Math.round(dash.facultyParticipation * 100)}%`
                : '—',
            },
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder={t('filters.courseId')}
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                placeholder={t('filters.facultyId')}
                value={facultyId}
                onChange={(e) => {
                  setFacultyId(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as ProjectSortOption);
                  setPage(1);
                }}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatSortOption(s)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={publishedFilter}
                onChange={(e) => {
                  setPublishedFilter(e.target.value as 'all' | 'yes' | 'no');
                  setPage(1);
                }}
              >
                <option value="all">{t('filters.publishedAll')}</option>
                <option value="yes">{t('filters.publishedYes')}</option>
                <option value="no">{t('filters.publishedNo')}</option>
              </select>
            </div>

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

            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={difficulty === d ? 'default' : 'outline'}
                  onClick={() => {
                    setDifficulty(d);
                    setPage(1);
                  }}
                >
                  {d === 'all' ? t('filters.allDifficulties') : formatProjectDifficulty(d)}
                </Button>
              ))}
              <Button
                size="sm"
                variant={archivedFilter === 'yes' ? 'default' : 'outline'}
                onClick={() => {
                  setArchivedFilter(archivedFilter === 'yes' ? 'all' : 'yes');
                  setPage(1);
                }}
              >
                {t('filters.archived')}
              </Button>
            </div>

            {selected.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium">{t('bulkSelected', { count: selected.length })}</p>
                <PermissionGate permission={PERMISSIONS.PROJECT_MANAGE}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkPublish.isPending}
                    onClick={async () => {
                      await bulkPublish.mutateAsync({ ids: selected });
                      setSelected([]);
                      showSuccess(t('bulkSuccess'));
                    }}
                  >
                    {t('bulkPublish')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkArchive.isPending}
                    onClick={async () => {
                      await bulkArchive.mutateAsync({ ids: selected });
                      setSelected([]);
                      showSuccess(t('bulkSuccess'));
                    }}
                  >
                    {t('bulkArchive')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkDuplicate.isPending}
                    onClick={async () => {
                      await bulkDuplicate.mutateAsync({ ids: selected });
                      setSelected([]);
                      showSuccess(t('bulkSuccess'));
                    }}
                  >
                    {t('bulkDuplicate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkDelete.isPending}
                    onClick={async () => {
                      await bulkDelete.mutateAsync({ ids: selected });
                      setSelected([]);
                      showSuccess(t('bulkSuccess'));
                    }}
                  >
                    {t('bulkDelete')}
                  </Button>
                  <Input
                    className="h-8 w-40"
                    placeholder={t('assignFacultyId')}
                    value={assignFacultyId}
                    onChange={(e) => setAssignFacultyId(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={bulkAssignFaculty.isPending || !assignFacultyId.trim()}
                    onClick={async () => {
                      await bulkAssignFaculty.mutateAsync({
                        ids: selected,
                        facultyId: assignFacultyId.trim(),
                      });
                      setSelected([]);
                      setAssignFacultyId('');
                      showSuccess(t('bulkSuccess'));
                    }}
                  >
                    {t('bulkAssignFaculty')}
                  </Button>
                </PermissionGate>
              </div>
            ) : null}

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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                      </th>
                      <th className="p-2 text-left">{t('projectTitle')}</th>
                      <th className="p-2 text-left">{t('filters.status')}</th>
                      <th className="p-2 text-left">{t('projectType')}</th>
                      <th className="p-2 text-left">{t('difficulty')}</th>
                      <th className="p-2 text-left">{t('due')}</th>
                      <th className="p-2 text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleOne(row.id)}
                          />
                        </td>
                        <td className="p-2">
                          <Link
                            href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}
                            className="font-medium hover:underline"
                          >
                            {row.title}
                          </Link>
                          {row.slug ? (
                            <p className="text-xs text-muted-foreground">{row.slug}</p>
                          ) : null}
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary">{formatProjectStatus(row.status)}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{formatProjectType(row.projectType)}</Badge>
                        </td>
                        <td className="p-2">{formatProjectDifficulty(row.difficulty)}</td>
                        <td className="p-2 text-muted-foreground">{formatDueDate(row.dueDate)}</td>
                        <td className="p-2 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}>
                                {t('view')}
                              </Link>
                            </Button>
                            {row.status === 'draft' ? (
                              <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                                <Button
                                  size="sm"
                                  disabled={publishMutation.isPending}
                                  onClick={() => void publishMutation.mutateAsync(row.id)}
                                >
                                  {t('publish')}
                                </Button>
                              </PermissionGate>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

        {dash?.departments?.length ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban className="size-4" />
                {t('departmentComparison')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dash.departments.slice(0, 8).map((d: { departmentId: string | null; label: string; count: number }) => (
                <div key={d.departmentId ?? d.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium">{d.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {categoriesQuery.data?.items?.length ? (
          <p className="text-xs text-muted-foreground">
            {t('categoriesCount', { count: categoriesQuery.data.items.length })}
          </p>
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
