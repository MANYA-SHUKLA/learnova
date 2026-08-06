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
  Settings2,
  Users,
} from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  StatusBadge,
  useAcademicYears,
  useCampuses,
  useDepartments,
  useMyInstitution,
  usePrograms,
  useSchools,
} from '@/features/institution';
import { Link } from '@/lib/i18n/routing';

const MODULES = [
  {
    href: APP_ROUTES.INSTITUTION_PROFILE,
    title: 'Profile & branding',
    description: 'Identity, contact, and brand assets.',
    icon: Building2,
  },
  {
    href: APP_ROUTES.INSTITUTION_CAMPUSES,
    title: 'Campuses',
    description: 'Locations and campus contacts.',
    icon: School,
  },
  {
    href: APP_ROUTES.INSTITUTION_SCHOOLS,
    title: 'Schools',
    description: 'Schools and faculties.',
    icon: GraduationCap,
  },
  {
    href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
    title: 'Departments',
    description: 'Departments under schools.',
    icon: Network,
  },
  {
    href: APP_ROUTES.INSTITUTION_PROGRAMS,
    title: 'Programs',
    description: 'Degree and certificate programs.',
    icon: BookOpen,
  },
  {
    href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS,
    title: 'Academic years',
    description: 'Year ranges and active terms.',
    icon: CalendarDays,
  },
  {
    href: APP_ROUTES.INSTITUTION_SETTINGS,
    title: 'Settings',
    description: 'Theme, grading, and policies.',
    icon: Settings2,
  },
] as const;

export default function InstitutionDashboardPage() {
  const { data: institution, isLoading, isError, error, refetch } = useMyInstitution();
  const campuses = useCampuses({ limit: 1 });
  const schools = useSchools({ limit: 1 });
  const departments = useDepartments({ limit: 1 });
  const programs = usePrograms({ limit: 1 });
  const years = useAcademicYears({ limit: 1 });

  const stats = [
    { label: 'Campuses', value: campuses.data?.meta.total ?? 0, icon: School },
    { label: 'Schools', value: schools.data?.meta.total ?? 0, icon: GraduationCap },
    { label: 'Departments', value: departments.data?.meta.total ?? 0, icon: Network },
    { label: 'Programs', value: programs.data?.meta.total ?? 0, icon: BookOpen },
    { label: 'Academic years', value: years.data?.meta.total ?? 0, icon: CalendarDays },
    {
      label: 'Student capacity',
      value: institution?.maxStudents ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Organization</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Institution</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Structure, academic calendar, and tenant settings for your campus.
          </p>
        </div>
        <Button asChild>
          <Link href={APP_ROUTES.INSTITUTION_PROFILE}>
            Edit profile
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load institution.'}
          onRetry={() => void refetch()}
        />
      ) : !institution ? (
        <EmptyState
          title="No institution linked"
          description="Create your institution profile to unlock campuses, schools, and programs."
          action={
            <Button asChild>
              <Link href={APP_ROUTES.INSTITUTION_PROFILE}>Set up institution</Link>
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-md"
        >
          <div className="bg-hero border-b border-border px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white shadow-glow">
                  {institution.shortName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    {institution.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {institution.shortName} · {institution.code} · {institution.slug}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {[institution.city, institution.state, institution.country]
                      .filter(Boolean)
                      .join(', ') || 'Location not set'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={institution.status} />
                <Badge variant="secondary" className="capitalize">
                  {institution.subscriptionPlan}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contact
              </p>
              <p className="mt-1 text-sm font-medium">{institution.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Capacity
              </p>
              <p className="mt-1 text-sm font-medium">
                {institution.maxStudents} students · {institution.maxFaculty} faculty
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Locale
              </p>
              <p className="mt-1 text-sm font-medium">
                {institution.timezone} · {institution.currency}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="hover:shadow-glow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-semibold tracking-tight">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Layers3 className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Modules</h2>
          <Badge variant="secondary">{MODULES.length}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="group block">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-glow">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary transition-colors group-hover:bg-primary/10">
                    <mod.icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <CardDescription className="mt-1">{mod.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
