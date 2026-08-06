'use client';

import { APP_ROUTES } from '@learnova/constants';
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
  Activity,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { cn } from '@/lib/utils';

const LIST_PARAMS = { limit: 50, page: 1 } as const;

const QUICK_ACTIONS = [
  {
    href: APP_ROUTES.INSTITUTION_CAMPUSES,
    title: 'Campuses',
    description: 'Manage locations',
    icon: School,
  },
  {
    href: APP_ROUTES.INSTITUTION_SCHOOLS,
    title: 'Schools',
    description: 'Faculties & schools',
    icon: GraduationCap,
  },
  {
    href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
    title: 'Departments',
    description: 'Org structure',
    icon: Network,
  },
  {
    href: APP_ROUTES.INSTITUTION_PROGRAMS,
    title: 'Programs',
    description: 'Degree offerings',
    icon: BookOpen,
  },
  {
    href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS,
    title: 'Academic years',
    description: 'Year ranges',
    icon: CalendarRange,
  },
  {
    href: APP_ROUTES.INSTITUTION_CALENDAR,
    title: 'Calendar',
    description: 'Key dates',
    icon: CalendarDays,
  },
] as const;

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

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
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
      label: 'Campuses',
      value: countFromQuery(campusesQuery.data),
      icon: School,
      href: APP_ROUTES.INSTITUTION_CAMPUSES,
      loading: campusesQuery.isLoading,
    },
    {
      label: 'Schools',
      value: countFromQuery(schoolsQuery.data),
      icon: GraduationCap,
      href: APP_ROUTES.INSTITUTION_SCHOOLS,
      loading: schoolsQuery.isLoading,
    },
    {
      label: 'Departments',
      value: countFromQuery(departmentsQuery.data),
      icon: Network,
      href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
      loading: departmentsQuery.isLoading,
    },
    {
      label: 'Programs',
      value: countFromQuery(programsQuery.data),
      icon: BookOpen,
      href: APP_ROUTES.INSTITUTION_PROGRAMS,
      loading: programsQuery.isLoading,
    },
    {
      label: 'Academic Years',
      value: countFromQuery(yearsQuery.data),
      icon: CalendarRange,
      href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS,
      loading: yearsQuery.isLoading,
    },
    {
      label: 'Semesters',
      value: countFromQuery(semestersQuery.data),
      icon: Layers3,
      href: APP_ROUTES.INSTITUTION_SEMESTERS,
      loading: semestersQuery.isLoading,
    },
  ];

  const chartData = stats.map((s) => ({ name: s.label.replace('Academic ', ''), count: s.value }));

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
  const hasNoStructure =
    !institutionQuery.isLoading &&
    stats.every((s) => !s.loading && s.value === 0) &&
    !institutionQuery.isError;

  if (institutionQuery.isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Institution overview</p>
        </div>
        <ErrorState
          message={
            institutionQuery.error instanceof Error
              ? institutionQuery.error.message
              : 'Unable to load institution dashboard.'
          }
          onRetry={() => void institutionQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Institution structure, capacity, and academic pulse at a glance.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={APP_ROUTES.INSTITUTION}>
            Open institution
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Institution hero */}
      <motion.div {...cardMotion} transition={{ duration: 0.35 }}>
        {institutionQuery.isLoading ? (
          <Card className="rounded-2xl border-border/80 shadow-soft-md">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ) : institution ? (
          <Card className="overflow-hidden rounded-2xl border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-soft-md">
            <CardContent className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">
                      {institution.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {institution.shortName} · {institution.code}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={institution.status} />
                  <Badge variant="secondary" className="rounded-lg capitalize">
                    {institution.subscriptionPlan} plan
                  </Badge>
                  {locationLabel(institution) ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {locationLabel(institution)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Student capacity
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                    {institution.maxStudents.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Plan limit</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Faculty capacity
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                    {institution.maxFaculty.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Plan limit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No institution linked"
            description="Connect or create an institution profile to unlock the academic workspace."
            action={
              <Button asChild>
                <Link href={APP_ROUTES.INSTITUTION}>Go to institution</Link>
              </Button>
            }
          />
        )}
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              {...cardMotion}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <Link href={stat.href} className="block h-full">
                <Card className="h-full rounded-2xl border-border/80 shadow-soft-md transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      {stat.loading ? (
                        <Skeleton className="mt-2 h-8 w-16" />
                      ) : (
                        <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight">
                          {stat.value}
                        </p>
                      )}
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {hasNoStructure ? (
        <EmptyState
          title="Your academic structure is empty"
          description="Start by adding campuses, schools, and programs to bring this dashboard to life."
          action={
            <Button asChild>
              <Link href={APP_ROUTES.INSTITUTION_CAMPUSES}>Add a campus</Link>
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* Chart */}
        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.1 }} className="min-w-0">
          <Card className="h-full min-w-0 rounded-2xl border-border/80 shadow-soft-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Module counts</CardTitle>
              <CardDescription>Distribution across institution resources</CardDescription>
            </CardHeader>
            <CardContent className="h-64 min-w-0 pt-2 sm:h-72">
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
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--popover))',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar + activity */}
        <div className="space-y-6">
          <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.14 }}>
            <Card className="rounded-2xl border-border/80 shadow-soft-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Calendar summary</CardTitle>
                    <CardDescription>
                      {calendarsQuery.isLoading
                        ? 'Loading calendars…'
                        : `${String(calendarCount)} calendar${calendarCount === 1 ? '' : 's'} · ${String(batchCount)} batches`}
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="rounded-lg">
                    <Link href={APP_ROUTES.INSTITUTION_CALENDAR}>View</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {calendarsQuery.isLoading ? (
                  <>
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </>
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
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
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    No upcoming events yet. Add dates on the academic calendar.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.18 }}>
            <Card className="rounded-2xl border-border/80 shadow-soft-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4 text-primary" />
                  Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Activity feed will appear as your team works
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quick actions */}
      <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.2 }}>
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold tracking-tight">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump into the modules you manage most often.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group">
                <Card
                  className={cn(
                    'h-full rounded-2xl border-border/80 shadow-soft-md transition-all',
                    'group-hover:border-primary/35 group-hover:shadow-soft-md',
                  )}
                >
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
