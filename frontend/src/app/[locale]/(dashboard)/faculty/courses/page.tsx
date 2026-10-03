'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { useCourseList } from '@/features/course';
import { Link } from '@/lib/i18n/routing';

export default function FacultyCoursesPage() {
  const t = useTranslations('dashboard.institution.aiContent');
  const courses = useCourseList({ page: 1, limit: 50 });

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_WRITE} enforce>
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t('myCourses')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('myCoursesDescription')}</p>
        </div>
        {courses.isLoading ? <Skeleton className="h-24 w-full" /> : null}
        {courses.isError ? (
          <p className="text-sm text-destructive">{t('failed')}</p>
        ) : null}
        <div className="grid gap-3">
          {(courses.data?.items ?? []).map((course) => (
            <Link key={course.id} href={`${APP_ROUTES.FACULTY_COURSES}/${course.id}/builder`}>
              <Card className="transition hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="size-4" />
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.courseCode}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
}
