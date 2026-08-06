'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Card, CardContent } from '@learnova/ui';
import type { ReactNode } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
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
    <PermissionGate
      permission={PERMISSIONS.INSTITUTION_READ}
      enforce
      fallback={
        <Card className="rounded-2xl shadow-soft-md">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            You need <code className="text-foreground">institution:read</code> permission to access
            institution management.
          </CardContent>
        </Card>
      }
    >
      <div className="mb-6 w-full min-w-0 print:hidden">
        <nav
          aria-label="Institution sections"
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </PermissionGate>
  );
}
