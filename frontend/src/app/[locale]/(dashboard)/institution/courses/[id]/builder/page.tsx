/**
 * Course Builder Page — permission-gated, COURSE_WRITE required
 */

'use client';

import { useParams } from 'next/navigation';
import { PERMISSIONS } from '@learnova/constants';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseBuilderShell } from '@/features/course-builder';

export default function CourseBuilderPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_WRITE} enforce>
      <CourseBuilderShell courseId={courseId} />
    </PermissionGate>
  );
}
