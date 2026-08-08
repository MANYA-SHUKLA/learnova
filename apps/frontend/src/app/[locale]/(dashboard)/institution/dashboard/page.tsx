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
  GraduationCap,
  Layers3,
  MapPin,
  Network,
  BookOpen,
  School,
  CalendarRange,
  Sparkles,
  CheckCircle2,
  Circle,
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
  DashboardHeroCard,
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
} from '@/components/dashboard/dashboard-template';
import {
  EmptyState,
  ErrorState,
  StatusBadge,
  useAcademicCalendars,
  useAcademicYears,
  useBatches,
  useCampuses,
  useDepartments,
  useMyInstitution,
  usePrograms,
  useSchools,
  useSemesters,
} from '@/features/institution';
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

function CapacityMeter({ label, value, planCapacity }: { label: string; value: number; planCapacity: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/75 p-4 backdrop-blur-sm">
      <p className="text-meta">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-caption">{planCapacity}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-brand-gradient"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function InstitutionDashboardPage() {
  const t = useTranslations('dashboard.home');
  const tCommon = useTranslations('common');

  const institutionQuery = useMyInstitution();
  const campusesQuery = useCampuses(LIST_PARAMS);
  const schoolsQuery = useSchools(LIST_PARAMS);
  const departmentsQuery = useDepartments(LIST_PARAMS);
  const programsQuery = usePrograms(LIST_PARAMS);
  const yearsQuery = useAcademicYears(LIST_PARAMS);
  const semestersQuery = useSemesters(LIST_PARAMS);
  const batchesQuery = useBatches(LIST_PARAMS);
  const calendarsQuery = useAcademicCalendars(LIST_PARAMS);

  const stats = [
    {
      key: 'campuses' as const,
      label: t('stats.campuses'),
      chartLabel: t('chart.campuses'),
      value: countFromQuery(campusesQuery.data),
      icon: School,
      href: APP_ROUTES.INSTITUTION_CAMPUSES,
      loading: campusesQuery.isLoading,
    },
    {
      key: 'schools' as const,
      label: t('stats.schools'),
      chartLabel: t('chart.schools'),
      value: countFromQuery(schoolsQuery.data),
      icon: GraduationCap,
      href: APP_ROUTES.INSTITUTION_SCHOOLS,
      loading: schoolsQuery.isLoading,
    },
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
      key: 'programs' as const,
      label: t('stats.programs'),
      chartLabel: t('chart.programs'),
      value: countFromQuery(programsQuery.data),
      icon: BookOpen,
      href: APP_ROUTES.INSTITUTION_PROGRAMS,
      loading: programsQuery.isLoading,
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
  ];

  const quickActions = [
    {
      href: APP_ROUTES.INSTITUTION_CAMPUSES,
      title: t('actions.campuses.title'),
      description: t('actions.campuses.description'),
      icon: School,
    },
    {
      href: APP_ROUTES.INSTITUTION_SCHOOLS,
      title: t('actions.schools.title'),
      description: t('actions.schools.description'),
      icon: GraduationCap,
    },
    {
      href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
      title: t('actions.departments.title'),
      description: t('actions.departments.description'),
      icon: Network,
    },
    {
      href: APP_ROUTES.INSTITUTION_PROGRAMS,
      title: t('actions.programs.title'),
      description: t('actions.programs.description'),
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
              <Link href={APP_ROUTES.INSTITUTION}>
                {t('openInstitution')}
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
                  {institution.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={institution.logo}
                      alt=""
                      className="size-14 shrink-0 rounded-xl border border-border/70 bg-background object-contain p-1.5 shadow-soft-sm"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-lg font-bold text-white shadow-glow">
                      {institution.shortName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
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
                <CapacityMeter
                  label={t('students')}
                  value={institution.maxStudents}
                  planCapacity={t('planCapacity')}
                />
                <CapacityMeter
                  label={t('faculty')}
                  value={institution.maxFaculty}
                  planCapacity={t('planCapacity')}
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
              <Link href={APP_ROUTES.INSTITUTION_CAMPUSES}>{t('addCampus')}</Link>
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
                      <div
                        key={event.id}
                        className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <p className="text-label">{event.title}</p>
                        <p className="mt-0.5 text-caption">
                          {event.calendarName} ·{' '}
                          {new Date(event.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
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
