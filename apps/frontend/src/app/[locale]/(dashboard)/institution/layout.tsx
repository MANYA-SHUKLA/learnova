'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Card, CardContent } from '@learnova/ui';
import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { Link, usePathname } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: APP_ROUTES.INSTITUTION, label: 'Overview', exact: true },
  { href: APP_ROUTES.INSTITUTION_PROFILE, label: 'Profile' },
  { href: APP_ROUTES.INSTITUTION_CAMPUSES, label: 'Campuses' },
  { href: APP_ROUTES.INSTITUTION_SCHOOLS, label: 'Schools' },
  { href: APP_ROUTES.INSTITUTION_DEPARTMENTS, label: 'Departments' },
  { href: APP_ROUTES.INSTITUTION_PROGRAMS, label: 'Programs' },
  { href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS, label: 'Academic years' },
  { href: APP_ROUTES.INSTITUTION_SEMESTERS, label: 'Semesters' },
  { href: APP_ROUTES.INSTITUTION_SECTIONS, label: 'Sections' },
  { href: APP_ROUTES.INSTITUTION_BATCHES, label: 'Batches' },
  { href: APP_ROUTES.INSTITUTION_CALENDAR, label: 'Calendar' },
  { href: APP_ROUTES.INSTITUTION_SETTINGS, label: 'Settings' },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname.endsWith(href);
  return pathname === href || pathname.includes(`${href}/`) || pathname.endsWith(href);
}

export default function InstitutionLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute
      enforce
      permissions={[PERMISSIONS.INSTITUTION_READ]}
      fallback={
        <main className="mx-auto max-w-3xl px-6 py-16">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              You need <code className="text-foreground">institution:read</code> permission to
              access institution management.
            </CardContent>
          </Card>
        </main>
      }
    >
      <div className="border-b border-border bg-muted/20 print:hidden">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, 'exact' in item && item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </ProtectedRoute>
  );
}
