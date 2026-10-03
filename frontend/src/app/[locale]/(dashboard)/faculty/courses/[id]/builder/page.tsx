'use client';

import { useParams } from 'next/navigation';
import { PERMISSIONS } from '@learnova/constants';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseBuilderShell } from '@/features/course-builder';

export default function FacultyCourseBuilderPage() {
  const params = useParams<{ id: string }>();

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_WRITE} enforce>
      <CourseBuilderShell courseId={params.id} audience="faculty" />
    </PermissionGate>
  );
}
