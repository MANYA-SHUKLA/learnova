'use client';

import { APP_ROUTES } from '@learnova/constants';
import { useEffect } from 'react';
import { Spinner } from '@learnova/ui';
import { useCurrentUser } from '@/features/auth/hooks/use-auth-queries';
import { useRouter } from '@/lib/i18n/routing';

/**
 * Legacy /courses placeholder → role-aware real destinations.
 */
export default function CoursesRedirectPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    const role = user?.role;
    if (role === 'institution_admin') {
      router.replace(APP_ROUTES.INSTITUTION_COURSES);
      return;
    }
    if (role === 'faculty') {
      router.replace(APP_ROUTES.FACULTY_ENROLLMENTS);
      return;
    }
    if (role === 'student') {
      router.replace(APP_ROUTES.STUDENT_ENROLLMENTS);
      return;
    }
    router.replace(APP_ROUTES.DASHBOARD);
  }, [isLoading, user?.role, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
