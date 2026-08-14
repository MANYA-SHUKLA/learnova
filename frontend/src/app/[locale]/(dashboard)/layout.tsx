'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Card, CardContent, Spinner } from '@learnova/ui';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SessionLoadingShell } from '@/components/shared/session-loading-shell';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { isPathAllowedForRole } from '@/lib/auth/role-routes';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const { isLoading, user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onChangePasswordPage =
    pathname === APP_ROUTES.CHANGE_PASSWORD ||
    pathname.endsWith('/account/change-password');

  const roleAllowed = user ? isPathAllowedForRole(pathname, user.role) : true;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      const next = pathname && pathname !== APP_ROUTES.LOGIN ? pathname : undefined;
      const loginPath = next
        ? `${APP_ROUTES.LOGIN}?next=${encodeURIComponent(next)}`
        : APP_ROUTES.LOGIN;
      router.replace(loginPath);
      return;
    }

    if (user.mustChangePassword && !onChangePasswordPage) {
      router.replace(APP_ROUTES.CHANGE_PASSWORD);
      return;
    }

    if (!roleAllowed) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isLoading, isAuthenticated, user, onChangePasswordPage, pathname, router, roleAllowed]);

  if (isLoading || !isAuthenticated || !user) {
    return <SessionLoadingShell message="Loading your session…" />;
  }

  if (user.mustChangePassword && !onChangePasswordPage) {
    return <SessionLoadingShell message="Redirecting…" />;
  }

  if (!roleAllowed) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background px-4">
        <Card className="max-w-md rounded-2xl shadow-soft-md">
          <CardContent className="space-y-2 pt-6 text-center">
            <p className="text-base font-medium text-foreground">Access denied</p>
            <p className="text-sm text-muted-foreground">
              Your account does not have access to this area. Redirecting to your dashboard…
            </p>
            <Spinner size="md" className="mx-auto mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.mustChangePassword && onChangePasswordPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return <AppShell>{children}</AppShell>;
}
