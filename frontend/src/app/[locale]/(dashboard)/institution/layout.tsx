'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Card, CardContent, Spinner } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { Link, usePathname, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { can } from '@/lib/auth/permissions';

const NAV_ITEMS = [
  { href: APP_ROUTES.INSTITUTION_DASHBOARD, labelKey: 'overview', exact: true },
  { href: APP_ROUTES.INSTITUTION_PROFILE, labelKey: 'profile' },
  { href: APP_ROUTES.INSTITUTION_CAMPUSES, labelKey: 'campuses' },
  { href: APP_ROUTES.INSTITUTION_SCHOOLS, labelKey: 'schools' },
  { href: APP_ROUTES.INSTITUTION_DEPARTMENTS, labelKey: 'departments' },
  { href: APP_ROUTES.INSTITUTION_PROGRAMS, labelKey: 'programs' },
  { href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS, labelKey: 'academicYears' },
  { href: APP_ROUTES.INSTITUTION_SEMESTERS, labelKey: 'semesters' },
  { href: APP_ROUTES.INSTITUTION_SECTIONS, labelKey: 'sections' },
  { href: APP_ROUTES.INSTITUTION_BATCHES, labelKey: 'batches' },
  { href: APP_ROUTES.INSTITUTION_CALENDAR, labelKey: 'calendar' },
  { href: APP_ROUTES.INSTITUTION_FACULTY, labelKey: 'faculty' },
  { href: APP_ROUTES.INSTITUTION_STUDENTS, labelKey: 'students' },
  { href: APP_ROUTES.INSTITUTION_COURSES, labelKey: 'courses' },
  { href: APP_ROUTES.INSTITUTION_ENROLLMENTS, labelKey: 'enrollments' },
  { href: APP_ROUTES.INSTITUTION_SETTINGS, labelKey: 'settings' },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname.endsWith(href);
  return pathname === href || pathname.includes(`${href}/`) || pathname.endsWith(href);
}

export default function InstitutionLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, isLoading, isAuthenticated } = useAuth();
  const tNav = useTranslations('nav');
  const t = useTranslations('dashboard.institution');
  const allowed = can(permissions, PERMISSIONS.INSTITUTION_READ);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (!allowed) {
      if (user.role === 'student' || user.role === 'faculty') {
        router.replace(`/forbidden?from=${encodeURIComponent(pathname)}`);
        return;
      }
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isLoading, isAuthenticated, user, allowed, router, pathname]);

  if (isLoading || (isAuthenticated && user && !allowed)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.INSTITUTION_READ}
      enforce
      fallback={
        <Card className="rounded-2xl shadow-soft-md">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('accessDenied')}
          </CardContent>
        </Card>
      }
    >
      <div className="mb-6 w-full min-w-0 print:hidden">
        <nav
          aria-label={t('navAriaLabel')}
          className="flex w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-border/80 bg-muted/40 p-1 shadow-soft-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, 'exact' in item && item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-background font-medium text-foreground shadow-soft-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                )}
              >
                {tNav(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </PermissionGate>
  );
}
