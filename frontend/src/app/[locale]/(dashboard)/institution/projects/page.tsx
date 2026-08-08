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
import { ArrowRight, FolderKanban, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DashboardPage, DashboardSection } from '@/components/dashboard';
import { CourseSelect, FacultySelect } from '@/components/shared/entity-selects';
import { PermissionGate } from '@/components/shared/protected-route';
import { SuccessPopup } from '@/components/shared/success-popup';
import { ErrorState } from '@/features/institution';
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
import { cn } from '@/lib/utils';

const STATUS_FILTERS: (ProjectStatus | 'open' | 'all')[] = [
  'all',
  'draft',
  'published',
  'open',
  'closed',
  'archived',
];

const SORT_OPTIONS: ProjectSortOption[] = ['newest', 'oldest', 'deadline', 'title', 'difficulty'];

const DIFFICULTIES: (ProjectDifficulty | 'all')[] = [
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

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <DashboardPage>
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          actions={
            <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
              <Button asChild className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_PROJECTS_CREATE}>
                  <Plus className="size-4" />
                  {t('create')}
                </Link>
              </Button>
            </PermissionGate>
          }
        />

        <StatGrid className="sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {dashQuery.isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <StatCard key={i} label="…" value="—" loading />
              ))
            : [
                { label: t('stats.total'), value: dash?.totalProjects ?? 0 },
                { label: t('stats.published'), value: dash?.published ?? 0 },
                { label: t('stats.active'), value: dash?.active ?? 0 },
                { label: t('stats.completed'), value: dash?.completed ?? 0 },
                { label: t('stats.departments'), value: dash?.departments?.length ?? 0 },
                {
                  label: t('stats.submissionRate'),
                  value: dash ? `${Math.round((dash.submissionRate ?? 0) * 100)}%` : '—',
                },
                {
                  label: t('stats.facultyParticipation'),
                  value:
                    dash?.facultyParticipation != null
                      ? `${Math.round(dash.facultyParticipation * 100)}%`
                      : '—',
                },
              ].map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  accent="primary"
                />
              ))}
        </StatGrid>

        <Card className="directory-shell overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-card-title">{t('listTitle')}</CardTitle>
            <CardDescription>{t('listDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listQuery.isError ? (
              <ErrorState message={t('error')} onRetry={() => void listQuery.refetch()} />
            ) : (
              <DataTable
                caption={t('listTitle')}
                loading={listQuery.isLoading}
                data={rows}
                rowKey={(row) => row.id}
                selectable
                selectedIds={selected}
                onSelectionChange={setSelected}
                bulkActions={
                  <PermissionGate permission={PERMISSIONS.PROJECT_MANAGE}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
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
                      className="rounded-xl"
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
                      className="rounded-xl"
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
                      variant="danger"
                      className="rounded-xl"
                      disabled={bulkDelete.isPending}
                      onClick={async () => {
                        await bulkDelete.mutateAsync({ ids: selected });
                        setSelected([]);
                        showSuccess(t('bulkSuccess'));
                      }}
                    >
                      {t('bulkDelete')}
                    </Button>
                    <FacultySelect
                      className="w-56"
                      label={t('assignFacultyId')}
                      value={assignFacultyId}
                      visibleRows={4}
                      onChange={setAssignFacultyId}
                    />
                    <Button
                      size="sm"
                      className="rounded-xl"
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
                }
                filters={
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <CourseSelect
                        allowEmpty
                        emptyLabel="All courses"
                        value={courseId}
                        visibleRows={4}
                        onChange={(value) => {
                          setCourseId(value);
                          setPage(1);
                        }}
                      />
                      <FacultySelect
                        allowEmpty
                        emptyLabel="All faculty"
                        value={facultyId}
                        visibleRows={4}
                        onChange={(value) => {
                          setFacultyId(value);
                          setPage(1);
                        }}
                      />
                      <select
                        className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setStatus(s);
                            setPage(1);
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            status === s
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          {s === 'all' ? t('filters.all') : formatProjectStatus(s)}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDifficulty(d);
                            setPage(1);
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            difficulty === d
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          {d === 'all' ? t('filters.allDifficulties') : formatProjectDifficulty(d)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setArchivedFilter(archivedFilter === 'yes' ? 'all' : 'yes');
                          setPage(1);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          archivedFilter === 'yes'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted/60',
                        )}
                      >
                        {t('filters.archived')}
                      </button>
                    </div>
                  </>
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
                      {t('search')}
                    </Button>
                  </div>
                }
                emptyTitle={t('emptyTitle')}
                emptyDescription={t('emptyDescription')}
                emptyAction={
                  <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                    <Button asChild className="rounded-xl">
                      <Link href={APP_ROUTES.INSTITUTION_PROJECTS_CREATE}>{t('create')}</Link>
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
                    id: 'title',
                    header: t('projectTitle'),
                    sortable: true,
                    sortValue: (row) => row.title,
                    cell: (row) => (
                      <Link
                        href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}
                        className="font-medium hover:text-primary"
                      >
                        <span className="block">{row.title}</span>
                        {row.slug ? (
                          <span className="block text-xs font-normal text-muted-foreground">{row.slug}</span>
                        ) : null}
                      </Link>
                    ),
                  },
                  {
                    id: 'status',
                    header: t('filters.status'),
                    cell: (row) => <Badge variant="secondary">{formatProjectStatus(row.status)}</Badge>,
                  },
                  {
                    id: 'type',
                    header: t('projectType'),
                    cell: (row) => <Badge variant="outline">{formatProjectType(row.projectType)}</Badge>,
                  },
                  {
                    id: 'difficulty',
                    header: t('difficulty'),
                    cell: (row) => formatProjectDifficulty(row.difficulty),
                  },
                  {
                    id: 'due',
                    header: t('due'),
                    cell: (row) => (
                      <span className="text-muted-foreground">{formatDueDate(row.dueDate)}</span>
                    ),
                  },
                ]}
                rowActions={(row) => (
                  <>
                    <Button asChild size="sm" variant="ghost" className="rounded-lg">
                      <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}>{t('view')}</Link>
                    </Button>
                    {row.status === 'draft' ? (
                      <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={publishMutation.isPending}
                          onClick={() => void publishMutation.mutateAsync(row.id)}
                        >
                          {t('publish')}
                        </Button>
                      </PermissionGate>
                    ) : null}
                  </>
                )}
                mobileRow={(row) => (
                  <Card className="rounded-xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.title}</p>
                          {row.slug ? <p className="text-xs text-muted-foreground">{row.slug}</p> : null}
                        </div>
                        <Badge variant="secondary">{formatProjectStatus(row.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatProjectType(row.projectType)} · {formatProjectDifficulty(row.difficulty)}
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                        <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${row.id}`}>
                          {t('view')}
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

        {dash?.departments?.length ? (
          <DashboardSection title={t('departmentComparison')}>
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
                    <span className="font-medium tabular-nums">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </DashboardSection>
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
      </DashboardPage>
    </PermissionGate>
  );
}
