'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Card, CardContent, Spinner } from '@learnova/ui';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { MadeWithLoveFooter } from '@/components/shared/made-with-love-footer';
import { DashboardRouteShell } from '@/components/shared/dashboard-route-shell';
import { HiddenRouteChildren } from '@/components/shared/hidden-route-children';
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

  const isSuperAdminArea =
    pathname === APP_ROUTES.CONSOLE ||
    pathname.startsWith(`${APP_ROUTES.CONSOLE}/`) ||
    pathname === APP_ROUTES.SUPERADMIN ||
    pathname.startsWith(`${APP_ROUTES.SUPERADMIN}/`);

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

  const pendingSession = isLoading || !isAuthenticated || !user;
  const pendingPasswordRedirect = Boolean(user?.mustChangePassword && !onChangePasswordPage);
  const pendingRoleRedirect = Boolean(user && !roleAllowed);

  const showSessionShell = pendingSession || pendingPasswordRedirect;
  const showAccessDenied = !pendingSession && pendingRoleRedirect;

  const showChangePasswordChrome = Boolean(user?.mustChangePassword && onChangePasswordPage);
  const showSuperAdminChrome = Boolean(
    user && !showSessionShell && !showAccessDenied && isSuperAdminArea,
  );
  const showAppChrome = Boolean(
    user && !showSessionShell && !showAccessDenied && !showChangePasswordChrome && !isSuperAdminArea,
  );

  const mountChildrenInChrome =
    showAppChrome || showChangePasswordChrome || showSuperAdminChrome;

  const sessionShellMessage = pendingPasswordRedirect
    ? 'Redirecting…'
    : 'Loading your session…';

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {showSessionShell ? <DashboardRouteShell message={sessionShellMessage} /> : null}

      {showAccessDenied ? (
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
      ) : null}

      {mountChildrenInChrome ? (
        showAppChrome ? (
          <>
            <AppShell className="min-h-0 flex-1">{children}</AppShell>
            <MadeWithLoveFooter />
          </>
        ) : showChangePasswordChrome ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex min-h-screen flex-col bg-background">
              <div className="flex-1">{children}</div>
              <MadeWithLoveFooter />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex min-h-screen flex-col bg-background">
              <div className="flex-1">{children}</div>
            </div>
          </div>
        )
      ) : (
        <HiddenRouteChildren>{children}</HiddenRouteChildren>
      )}
    </div>
  );
}
