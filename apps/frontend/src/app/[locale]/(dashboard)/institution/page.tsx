'use client';

import { APP_ROUTES } from '@learnova/constants';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  useMyInstitution,
} from '@/features/institution';
import { Link } from '@/lib/i18n/routing';

const MODULES = [
  {
    href: APP_ROUTES.INSTITUTION_PROFILE,
    title: 'Profile & branding',
    description: 'Institution identity, contact, and brand assets.',
  },
  {
    href: APP_ROUTES.INSTITUTION_CAMPUSES,
    title: 'Campuses',
    description: 'Physical locations and campus contacts.',
  },
  {
    href: APP_ROUTES.INSTITUTION_SCHOOLS,
    title: 'Schools',
    description: 'Schools and faculties within the institution.',
  },
  {
    href: APP_ROUTES.INSTITUTION_DEPARTMENTS,
    title: 'Departments',
    description: 'Departments nested under schools.',
  },
  {
    href: APP_ROUTES.INSTITUTION_PROGRAMS,
    title: 'Programs',
    description: 'Degree and certificate programs.',
  },
  {
    href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS,
    title: 'Academic years',
    description: 'Active and historical academic year ranges.',
  },
  {
    href: APP_ROUTES.INSTITUTION_SEMESTERS,
    title: 'Semesters',
    description: 'Terms within each academic year.',
  },
  {
    href: APP_ROUTES.INSTITUTION_SECTIONS,
    title: 'Sections',
    description: 'Class sections by program and semester.',
  },
  {
    href: APP_ROUTES.INSTITUTION_BATCHES,
    title: 'Batches',
    description: 'Student cohorts by program and year.',
  },
  {
    href: APP_ROUTES.INSTITUTION_CALENDAR,
    title: 'Academic calendar',
    description: 'Key dates, holidays, and exam windows.',
  },
  {
    href: APP_ROUTES.INSTITUTION_SETTINGS,
    title: 'Settings',
    description: 'Language, theme, grading, and policy defaults.',
  },
] as const;

export default function InstitutionDashboardPage() {
  const { data: institution, isLoading, isError, error, refetch } = useMyInstitution();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title="Institution"
        description="Manage organization structure, academic calendar, and tenant settings."
      />

      {isLoading ? (
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </CardContent>
        </Card>
      ) : isError ? (
        <div className="mb-8">
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load institution.'}
            onRetry={() => void refetch()}
          />
        </div>
      ) : !institution ? (
        <div className="mb-8">
          <EmptyState
            title="No institution linked"
            description="Your account is not associated with an institution yet."
          />
        </div>
      ) : (
        <Card className="mb-8">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-display text-xl">{institution.name}</CardTitle>
              <CardDescription>
                {institution.shortName} · {institution.code} · {institution.slug}
              </CardDescription>
            </div>
            <StatusBadge status={institution.status} />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm">
                {[institution.city, institution.state, institution.country]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm capitalize">{institution.subscriptionPlan}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Limits</p>
              <p className="text-sm">
                {institution.maxStudents} students · {institution.maxFaculty} faculty
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Timezone</p>
              <p className="text-sm">{institution.timezone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="text-sm">{institution.currency}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact</p>
              <p className="text-sm">{institution.email}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">Modules</h2>
        <Badge variant="secondary">{MODULES.length}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href} className="group block">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <CardHeader>
                <CardTitle className="text-base">{mod.title}</CardTitle>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
