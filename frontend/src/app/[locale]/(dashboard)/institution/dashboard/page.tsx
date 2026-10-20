'use client';

import { APP_ROUTES } from '@learnova/constants';
import {
  Badge,
  Button,
  PageHeader,
  Skeleton,
  StatCard,
  StatGrid,
} from '@learnova/ui';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Layers3,
  MapPin,
  Network,
  BookOpen,
  CalendarRange,
  Sparkles,
  CheckCircle2,
  Circle,
  Users,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DashboardAnalyticsGrid,
  DashboardCapacityMetric,
  DashboardHeroCard,
  DashboardInsightRow,
  DashboardPage,
  DashboardPanelCard,
  DashboardPanelEmpty,
  DashboardPanelLink,
  DashboardProgressMetric,
  DashboardQuickActionGrid,
  DashboardSection,
  DASHBOARD_CHART_COLORS,
  DASHBOARD_CHART_TOOLTIP,
  dashboardFadeUp,
} from '@/components/dashboard';
import { InstitutionMark } from '@/components/institution/institution-mark';
import {
  EmptyState,
  ErrorState,
  StatusBadge,
  useAcademicCalendars,
  useAcademicYears,
  useBatches,
  useDepartments,
  useMyInstitution,
  usePrograms,
  useSemesters,
} from '@/features/institution';
import { useFacultyStats } from '@/features/faculty';
import { useStudentStats } from '@/features/student';
import { Link } from '@/lib/i18n/routing';
import { isInstitutionNotFound } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

const LIST_PARAMS = { limit: 50, page: 1 } as const;

function countFromQuery(data?: { meta?: { total?: number }; items?: unknown[] }) {
  if (typeof data?.meta?.total === 'number') return data.meta.total;
  return data?.items?.length ?? 0;
}

function locationLabel(institution: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}) {
  return [institution.city, institution.state, institution.country].filter(Boolean).join(', ');
}

export default function InstitutionDashboardPage() {
  const t = useTranslations('dashboard.home');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tBranches = useTranslations('dashboard.institution.branches');
  const branchesLabel = tNav('branches');

  const institutionQuery = useMyInstitution();
  const departmentsQuery = useDepartments(LIST_PARAMS);
  const branchesQuery = usePrograms(LIST_PARAMS);
  const yearsQuery = useAcademicYears(LIST_PARAMS);
  const semestersQuery = useSemesters(LIST_PARAMS);
  const batchesQuery = useBatches(LIST_PARAMS);
  const calendarsQuery = useAcademicCalendars(LIST_PARAMS);
  const studentStatsQuery = useStudentStats();
  const facultyStatsQuery = useFacultyStats();

  const stats = [
    {
      key: 'departments' as const,
      label: t('stats.departments'),
      chartLabel: t('chart.departments'),
      value: countFromQuery(departmentsQuery.data),
      icon: Network,
      href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
      loading: departmentsQuery.isLoading,
    },
    {
      key: 'branches' as const,
      label: branchesLabel,
      chartLabel: branchesLabel,
      value: countFromQuery(branchesQuery.data),
      icon: BookOpen,
      href: APP_ROUTES.INSTITUTION_PROGRAMS,
      loading: branchesQuery.isLoading,
    },
    {
      key: 'academicYears' as const,
      label: t('stats.academicYears'),
      chartLabel: t('chart.years'),
      value: countFromQuery(yearsQuery.data),
      icon: CalendarRange,
      href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS,
      loading: yearsQuery.isLoading,
    },
    {
      key: 'semesters' as const,
      label: t('stats.semesters'),
      chartLabel: t('chart.semesters'),
      value: countFromQuery(semestersQuery.data),
      icon: Layers3,
      href: APP_ROUTES.INSTITUTION_SEMESTERS,
      loading: semestersQuery.isLoading,
    },
    {
      key: 'students' as const,
      label: t('stats.students'),
      chartLabel: t('chart.students'),
      value: studentStatsQuery.data?.total ?? 0,
      icon: Users,
      href: APP_ROUTES.INSTITUTION_STUDENTS,
      loading: studentStatsQuery.isLoading,
    },
    {
      key: 'faculty' as const,
      label: t('stats.faculty'),
      chartLabel: t('chart.faculty'),
      value: facultyStatsQuery.data?.total ?? 0,
      icon: UserRound,
      href: APP_ROUTES.INSTITUTION_FACULTY,
      loading: facultyStatsQuery.isLoading,
    },
  ];

  const quickActions = [
    {
      href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
      title: t('actions.departments.title'),
      description: t('actions.departments.description'),
      icon: Network,
    },
    {
      href: APP_ROUTES.INSTITUTION_PROGRAMS,
      title: tBranches('title'),
      description: tBranches('description'),
      icon: BookOpen,
    },
    {
      href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS,
      title: t('actions.academicYears.title'),
      description: t('actions.academicYears.description'),
      icon: CalendarRange,
    },
    {
      href: APP_ROUTES.INSTITUTION_CALENDAR,
      title: t('actions.calendar.title'),
      description: t('actions.calendar.description'),
      icon: CalendarDays,
    },
    {
      href: APP_ROUTES.INSTITUTION_STUDENTS,
      title: t('actions.searchStudents.title'),
      description: t('actions.searchStudents.description'),
      icon: Users,
    },
    {
      href: APP_ROUTES.INSTITUTION_STUDENTS_IMPORT,
      title: t('actions.students.title'),
      description: t('actions.students.description'),
      icon: Users,
    },
    {
      href: APP_ROUTES.INSTITUTION_FACULTY_IMPORT,
      title: t('actions.faculty.title'),
      description: t('actions.faculty.description'),
      icon: UserRound,
    },
  ] as const;

  const chartData = stats.map((s) => ({ name: s.chartLabel, count: s.value }));
  const calendarCount = countFromQuery(calendarsQuery.data);
  const upcomingEvents =
    calendarsQuery.data?.items
      .flatMap((calendar) =>
        calendar.events.map((event) => ({
          ...event,
          calendarName: calendar.name,
        })),
      )
      .filter((event) => new Date(event.startDate).getTime() >= Date.now() - 86_400_000)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4) ?? [];

  const batchCount = countFromQuery(batchesQuery.data);
  const institution = institutionQuery.data;
  const structureReady = stats.filter((s) => !s.loading && s.value > 0).length;
  const structurePct = Math.round((structureReady / stats.length) * 100);
  const hasNoStructure =
    !institutionQuery.isLoading &&
    stats.every((s) => !s.loading && s.value === 0) &&
    !institutionQuery.isError;

  const calendarsLabel =
    calendarCount === 1
      ? t('calendarCountOne', { count: calendarCount })
      : t('calendarCount', { count: calendarCount });
  const batchesLabel =
    batchCount === 1
      ? t('batchCountOne', { count: batchCount })
      : t('batchCount', { count: batchCount });

  if (institutionQuery.isError) {
    const missing = isInstitutionNotFound(institutionQuery.error);
    return (
      <DashboardPage>
        <PageHeader title={t('errorTitle')} description={t('errorDescription')} />
        {missing ? (
          <EmptyState
            illustration="building"
            title={t('finishSetupTitle')}
            description={t('finishSetupDescription')}
            action={
              <Button asChild className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_SETUP}>{t('continueSetup')}</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            message={
              institutionQuery.error instanceof Error
                ? institutionQuery.error.message
                : t('loadFailed')
            }
            onRetry={() => void institutionQuery.refetch()}
          />
        )}
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={APP_ROUTES.INSTITUTION_PROFILE}>{t('editBranding')}</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href={APP_ROUTES.INSTITUTION_SETTINGS}>
                {tNav('settings')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <motion.div {...dashboardFadeUp}>
        {institutionQuery.isLoading ? (
          <DashboardHeroCard>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="size-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-64 max-w-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            </div>
          </DashboardHeroCard>
        ) : institution ? (
          <DashboardHeroCard>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-start gap-4">
                  <InstitutionMark
                    branding={{
                      name: institution.name,
                      shortName: institution.shortName,
                      logo: institution.logo,
                      favicon: institution.favicon,
                    }}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-section-title">{institution.name}</h2>
                    <p className="mt-0.5 text-caption">
                      {institution.shortName} · {institution.code}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={institution.status} />
                      <Badge variant="secondary" className="rounded-lg capitalize">
                        {t('planBadge', { plan: institution.subscriptionPlan })}
                      </Badge>
                      {locationLabel(institution) ? (
                        <span className="inline-flex items-center gap-1.5 text-caption">
                          <MapPin className="size-3.5" />
                          {locationLabel(institution)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <DashboardProgressMetric
                  label={t('structureReadiness')}
                  value={`${structurePct}%`}
                  hint={t('modulesHaveRecords', { ready: structureReady, total: stats.length })}
                  percent={structurePct}
                  icon={Sparkles}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <DashboardCapacityMetric
                  label={t('students')}
                  value={studentStatsQuery.data?.total ?? 0}
                  hint={t('capacityOfMax', {
                    max: (institution.maxStudents ?? 0).toLocaleString(),
                  })}
                  percent={
                    institution.maxStudents
                      ? Math.round(
                          ((studentStatsQuery.data?.total ?? 0) / institution.maxStudents) * 100,
                        )
                      : 0
                  }
                />
                <DashboardCapacityMetric
                  label={t('faculty')}
                  value={facultyStatsQuery.data?.total ?? 0}
                  hint={t('capacityOfMax', {
                    max: (institution.maxFaculty ?? 0).toLocaleString(),
                  })}
                  percent={
                    institution.maxFaculty
                      ? Math.round(
                          ((facultyStatsQuery.data?.total ?? 0) / institution.maxFaculty) * 100,
                        )
                      : 0
                  }
                />
              </div>
            </div>
          </DashboardHeroCard>
        ) : (
          <EmptyState
            illustration="building"
            title={t('noInstitutionTitle')}
            description={t('noInstitutionDescription')}
            action={
              <Button asChild className="rounded-xl">
                <Link href={APP_ROUTES.INSTITUTION_SETUP}>{t('continueSetup')}</Link>
              </Button>
            }
          />
        )}
      </motion.div>

      <StatGrid className="sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.key} href={stat.href} className="block h-full">
              <StatCard
                label={stat.label}
                value={stat.value}
                icon={Icon}
                loading={stat.loading}
                accent="primary"
              />
            </Link>
          );
        })}
      </StatGrid>

      {hasNoStructure ? (
        <EmptyState
          illustration="campus"
          title={t('emptyStructureTitle')}
          description={t('emptyStructureDescription')}
          action={
            <Button asChild className="rounded-xl">
              <Link href={APP_ROUTES.INSTITUTION_DEPARTMENTS}>{t('addDepartment')}</Link>
            </Button>
          }
        />
      ) : null}

      <DashboardAnalyticsGrid
        main={
          <motion.div {...dashboardFadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
            <DashboardPanelCard
              title={t('moduleDistribution')}
              description={t('moduleDistributionDescription')}
              contentClassName="h-64 min-w-0 pt-2 sm:h-72"
            >
              {stats.some((s) => s.loading) ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={64}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.45 }}
                      {...DASHBOARD_CHART_TOOLTIP}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={chartData[i]!.name} fill={DASHBOARD_CHART_COLORS[i % DASHBOARD_CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </DashboardPanelCard>
          </motion.div>
        }
        aside={
          <>
            <motion.div {...dashboardFadeUp} transition={{ duration: 0.35, delay: 0.14 }}>
              <DashboardPanelCard
                title={t('calendarSummary')}
                description={
                  calendarsQuery.isLoading
                    ? t('loadingCalendars')
                    : t('calendarSummaryMeta', {
                        calendars: calendarsLabel,
                        batches: batchesLabel,
                      })
                }
                action={<DashboardPanelLink href={APP_ROUTES.INSTITUTION_CALENDAR} label={tCommon('view')} />}
              >
                <div className="space-y-3">
                  {calendarsQuery.isLoading ? (
                    <>
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </>
                  ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <DashboardInsightRow
                        key={event.id}
                        title={event.title}
                        subtitle={`${event.calendarName} · ${new Date(event.startDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}`}
                        href={APP_ROUTES.INSTITUTION_CALENDAR}
                      />
                    ))
                  ) : (
                    <DashboardPanelEmpty message={t('noUpcomingEvents')} />
                  )}
                </div>
              </DashboardPanelCard>
            </motion.div>

            <motion.div {...dashboardFadeUp} transition={{ duration: 0.35, delay: 0.18 }}>
              <DashboardPanelCard
                title={
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="size-4 text-primary" aria-hidden />
                    {t('structurePulse')}
                  </span>
                }
                description={t('structurePulseDescription')}
              >
                <div className="space-y-2.5">
                  {stats.map((stat) => {
                    const ready = !stat.loading && stat.value > 0;
                    return (
                      <div
                        key={stat.key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          {ready ? (
                            <CheckCircle2 className="size-4 text-success" aria-hidden />
                          ) : (
                            <Circle className="size-4 text-muted-foreground/50" aria-hidden />
                          )}
                          <span className="text-label">{stat.label}</span>
                        </div>
                        <span
                          className={cn(
                            'text-caption tabular-nums',
                            ready ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {stat.loading ? '…' : stat.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </DashboardPanelCard>
            </motion.div>
          </>
        }
      />

      <motion.div {...dashboardFadeUp} transition={{ duration: 0.35, delay: 0.2 }}>
        <DashboardSection title={t('quickActionsTitle')} description={t('quickActionsDescription')}>
          <DashboardQuickActionGrid actions={[...quickActions]} />
        </DashboardSection>
      </motion.div>
    </DashboardPage>
  );
}
