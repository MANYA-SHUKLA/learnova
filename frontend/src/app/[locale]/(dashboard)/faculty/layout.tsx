'use client';

import { Card, CardContent, Spinner } from '@learnova/ui';
import { useEffect, type ReactNode } from 'react';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { isPathAllowedForRole } from '@/lib/auth/role-routes';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

/** Faculty route group — blocks institution_admin and student roles. */
export default function FacultyLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const allowed = user?.role === 'faculty' && isPathAllowedForRole(pathname, 'faculty');

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (user.role !== 'faculty') {
      router.replace(user.role === 'student' ? '/forbidden?from=' + encodeURIComponent(pathname) : dashboardPathForRole(user.role));
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading || !user || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <Card className="rounded-2xl shadow-soft-md">
        <CardContent className="pt-6 text-sm text-muted-foreground">Access denied.</CardContent>
      </Card>
    );
  }

  return children;
}
