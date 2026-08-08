'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Spinner } from '@learnova/ui';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const { isLoading, user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onChangePasswordPage =
    pathname === APP_ROUTES.CHANGE_PASSWORD ||
    pathname.endsWith('/account/change-password');

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
    }
  }, [isLoading, isAuthenticated, user, onChangePasswordPage, pathname, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your session…</p>
      </div>
    );
  }

  if (user.mustChangePassword && !onChangePasswordPage) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  if (user.mustChangePassword && onChangePasswordPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return <AppShell>{children}</AppShell>;
}
