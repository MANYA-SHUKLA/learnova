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
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Flame,
  Hourglass,
  NotebookPen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  ActivityTimeline,
  ContinueLearningCard,
  ProgressFilters,
  ProgressStatCards,
  formatLearningStatus,
  formatMinutes,
  formatPercent,
  useMyProgress,
  useProgressStore,
  useStudentProgressDashboard,
} from '@/features/progress';
import { Link } from '@/lib/i18n/routing';

export default function StudentProgressPage() {
  const t = useTranslations('dashboard.student.progress');
  const status = useProgressStore((s) => s.status);
  const search = useProgressStore((s) => s.search);
  const recent = useProgressStore((s) => s.recent);
  const bookmarked = useProgressStore((s) => s.bookmarked);
  const setStatus = useProgressStore((s) => s.setStatus);
  const setSearch = useProgressStore((s) => s.setSearch);
  const setRecent = useProgressStore((s) => s.setRecent);
  const setBookmarked = useProgressStore((s) => s.setBookmarked);
  const resetFilters = useProgressStore((s) => s.resetFilters);

  const [submittedSearch, setSubmittedSearch] = useState('');

  const listParams = useMemo(
    () => ({
      q: submittedSearch || undefined,
      status: status === 'all' ? undefined : status,
      recent: recent || undefined,
      bookmarked: bookmarked || undefined,
      page: 1,
      limit: 20,
      sortBy: 'lastAccessedAt',
      sortOrder: 'desc' as const,
    }),
    [submittedSearch, status, recent, bookmarked],
  );

  const dashboardQuery = useStudentProgressDashboard();
  const listQuery = useMyProgress(listParams);

  const dashboard = dashboardQuery.data;
  const courses = listQuery.data?.items ?? [];

  const stats = [
    {
      id: 'inProgress',
      label: t('stats.inProgress'),
      value: dashboard?.coursesInProgress ?? 0,
      icon: BookOpen,
    },
    {
      id: 'completed',
      label: t('stats.completed'),
      value: dashboard?.completedCourses ?? 0,
      icon: CheckCircle2,
    },
    {
      id: 'hours',
      label: t('stats.hoursLearned'),
      value: dashboard?.hoursLearned ?? 0,
      icon: Hourglass,
    },
    {
      id: 'streak',
      label: t('stats.streak'),
      value: dashboard?.currentStreakDays ?? 0,
      icon: Flame,
      hint: t('stats.streakHint'),
    },
  ];

  return (
    <PermissionGate permission={PERMISSIONS.PROGRESS_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {dashboardQuery.isError ? (
          <ErrorState
            message={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : t('loadError')
            }
            onRetry={() => void dashboardQuery.refetch()}
          />
        ) : null}

        <ProgressStatCards items={stats} loading={dashboardQuery.isLoading} />

        <ContinueLearningCard
          items={dashboard?.continueLearning ?? []}
          title={t('continueTitle')}
          description={t('continueDescription')}
          emptyLabel={t('continueEmpty')}
          resumeLabel={t('resume')}
        />

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('coursesTitle')}</CardTitle>
              <CardDescription>{t('coursesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressFilters
                search={search}
                status={status}
                recent={recent}
                bookmarked={bookmarked}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onRecentChange={setRecent}
                onBookmarkedChange={setBookmarked}
                onSubmitSearch={() => setSubmittedSearch(search.trim())}
                onClear={() => {
                  resetFilters();
                  setSubmittedSearch('');
                }}
                searchPlaceholder={t('searchPlaceholder')}
              />

              {listQuery.isError ? (
                <ErrorState
                  message={
                    listQuery.error instanceof Error ? listQuery.error.message : t('loadError')
                  }
                  onRetry={() => void listQuery.refetch()}
                />
              ) : null}

              {listQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <EmptyState
                  illustration="inbox"
                  title={t('emptyTitle')}
                  description={t('emptyDescription')}
                />
              ) : (
                <div className="space-y-3">
                  {courses.map((row) => {
                    const href = APP_ROUTES.STUDENT_PROGRESS_COURSE.replace(':id', row.courseId);
                    return (
                      <Card key={row.id} className="rounded-2xl">
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{row.courseId}</p>
                              <Badge variant="secondary">
                                {formatLearningStatus(row.status)}
                              </Badge>
                              <Badge variant="outline">
                                {formatPercent(row.progressPercentage)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Hourglass className="size-3.5" />
                                {formatMinutes(row.timeSpentMinutes)} learned
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BookMarked className="size-3.5" />
                                {row.bookmarksCount}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <NotebookPen className="size-3.5" />
                                {row.notesCount}
                              </span>
                            </div>
                            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${Math.min(100, Math.max(0, row.progressPercentage))}%`,
                                }}
                              />
                            </div>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>{t('viewCourse')}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityTimeline
            items={dashboard?.recentActivity ?? []}
            loading={dashboardQuery.isLoading}
            title={t('activityTitle')}
            description={t('activityDescription')}
            emptyLabel={t('activityEmpty')}
          />
        </div>
      </div>
    </PermissionGate>
  );
}
