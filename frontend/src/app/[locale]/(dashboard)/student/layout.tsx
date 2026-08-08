'use client';

import { Card, CardContent, Spinner } from '@learnova/ui';
import { useEffect, type ReactNode } from 'react';
import { isPathAllowedForRole } from '@/lib/auth/role-routes';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

/** Student route group — blocks faculty and institution_admin roles. */
export default function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const allowed = user?.role === 'student' && isPathAllowedForRole(pathname, 'student');

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (user.role !== 'student') {
      router.replace('/forbidden?from=' + encodeURIComponent(pathname));
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
