'use client';

import { RoleWelcome } from '@/components/shared/role-welcome';

export default function CoursesPlaceholderPage() {
  return (
    <RoleWelcome
      roleLabel="Courses"
      title="Courses"
      preparingLine="The courses workspace is being prepared."
      modulesIntro="Course catalogs and enrollments will appear here once your institution assigns programs."
      modules={['Course catalog', 'Enrollments', 'Schedules', 'Materials', 'Assessments']}
    />
  );
}
