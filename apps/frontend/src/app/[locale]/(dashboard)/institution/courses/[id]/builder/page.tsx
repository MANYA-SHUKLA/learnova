/**
 * Course Builder Page — permission-gated, COURSE_WRITE required
 */

'use client';

import { useParams } from 'next/navigation';
import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { ArrowLeft } from 'lucide-react';
import { PermissionGate } from '@/components/shared/protected-route';
import { Link } from '@/lib/i18n/routing';
import { CourseBuilderShell } from '@/features/course-builder';

export default function CourseBuilderPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_WRITE} enforce>
      <div className="flex h-screen flex-col">
        <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-6 py-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`${APP_ROUTES.INSTITUTION_COURSES}/${courseId}`}>
              <ArrowLeft className="size-4" />
              Back to Course
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Course Builder</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <CourseBuilderShell courseId={courseId} />
        </div>
      </div>
    </PermissionGate>
  );
}
