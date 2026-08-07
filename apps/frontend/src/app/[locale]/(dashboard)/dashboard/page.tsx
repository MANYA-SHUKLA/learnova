'use client';

/**
 * Role home router — authenticated users land here from middleware / auth routes.
 */

import { APP_ROUTES } from '@learnova/constants';
import { Spinner } from '@learnova/ui';
import { useEffect } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardHomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace(APP_ROUTES.LOGIN);
      return;
    }
    router.replace(dashboardPathForRole(user.role));
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-background py-24">
      <Spinner size="lg" />
    </div>
  );
}
