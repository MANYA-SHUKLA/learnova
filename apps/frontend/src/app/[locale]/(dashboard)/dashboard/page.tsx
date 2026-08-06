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
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react';
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

const CHART_COLORS = [
  'hsl(217 91% 53%)',
  'hsl(224 76% 48%)',
  'hsl(262 70% 52%)',
  'hsl(199 89% 42%)',
  'hsl(173 58% 39%)',
  'hsl(215 20% 45%)',
];

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

function CapacityMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/75 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Plan capacity</p>
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
  const structureReady = stats.filter((s) => !s.loading && s.value > 0).length;
  const structurePct = Math.round((structureReady / stats.length) * 100);
  const hasNoStructure =
    !institutionQuery.isLoading &&
    stats.every((s) => !s.loading && s.value === 0) &&
    !institutionQuery.isError;

  if (institutionQuery.isError) {
    const missing = isInstitutionNotFound(institutionQuery.error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Institution overview</p>
        </div>
        {missing ? (
          <EmptyState
            illustration="building"
            title="Finish institution setup"
            description="Complete your profile, branding, and contact details to unlock the workspace."
            action={
              <Button asChild>
                <Link href={APP_ROUTES.INSTITUTION_SETUP}>Continue setup</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            message={
              institutionQuery.error instanceof Error
                ? institutionQuery.error.message
                : 'Unable to load institution dashboard.'
            }
            onRetry={() => void institutionQuery.refetch()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Overview</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Institution dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structure, capacity, and academic pulse at a glance.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto">
            <Link href={APP_ROUTES.INSTITUTION_PROFILE}>Edit branding</Link>
          </Button>
          <Button asChild className="w-full rounded-xl sm:w-auto">
            <Link href={APP_ROUTES.INSTITUTION}>
              Open institution
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <motion.div {...cardMotion} transition={{ duration: 0.35 }}>
        {institutionQuery.isLoading ? (
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-soft-md">
            <CardContent className="space-y-4 bg-hero p-6 sm:p-8">
              <div className="flex gap-4">
                <Skeleton className="size-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-64 max-w-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        ) : institution ? (
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-soft-lg">
            <div className="bg-hero relative">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 12% 20%, hsl(var(--primary) / 0.18), transparent 42%), radial-gradient(circle at 88% 10%, hsl(var(--accent) / 0.14), transparent 38%)',
                }}
              />
              <CardContent className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-start gap-4">
                    {institution.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={institution.logo}
                        alt=""
                        className="size-14 shrink-0 rounded-2xl border border-border/70 bg-background object-contain p-1.5 shadow-soft-sm"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white shadow-glow">
                        {institution.shortName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
                        {institution.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {institution.shortName} · {institution.code}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
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
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        <p className="text-sm font-medium">Structure readiness</p>
                      </div>
                      <p className="font-display text-lg font-semibold tabular-nums">{structurePct}%</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-brand-gradient"
                        initial={{ width: 0 }}
                        animate={{ width: `${structurePct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {structureReady} of {stats.length} modules have records
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <CapacityMeter label="Students" value={institution.maxStudents} />
                  <CapacityMeter label="Faculty" value={institution.maxFaculty} />
                </div>
              </CardContent>
            </div>
          </Card>
        ) : (
          <EmptyState
            illustration="building"
            title="No institution linked"
            description="Connect or create an institution profile to unlock the academic workspace."
            action={
              <Button asChild>
                <Link href={APP_ROUTES.INSTITUTION_SETUP}>Continue setup</Link>
              </Button>
            }
          />
        )}
      </motion.div>

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
                <Card className="card-interactive h-full rounded-2xl border-border/80">
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
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
          illustration="campus"
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
        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.1 }} className="min-w-0">
          <Card className="h-full min-w-0 rounded-2xl border-border/80 shadow-soft-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Module distribution</CardTitle>
              <CardDescription>Counts across your institution workspace</CardDescription>
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
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={chartData[i]!.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                      className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50"
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
                  <Building2 className="size-4 text-primary" />
                  Structure pulse
                </CardTitle>
                <CardDescription>What’s ready in your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {stats.map((stat) => {
                  const ready = !stat.loading && stat.value > 0;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        {ready ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/50" />
                        )}
                        <span className="text-sm">{stat.label}</span>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium tabular-nums',
                          ready ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {stat.loading ? '…' : stat.value}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

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
                <Card className="card-interactive h-full rounded-2xl border-border/80">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
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
