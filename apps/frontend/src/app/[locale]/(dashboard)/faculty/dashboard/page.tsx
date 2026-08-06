'use client';

import { RoleWelcome } from '@/components/shared/role-welcome';

export default function FacultyDashboardPage() {
  return (
    <RoleWelcome
      roleLabel="Faculty"
      title="Faculty Dashboard"
      modulesIntro="The following modules will appear automatically once courses are assigned."
      modules={['My Courses', 'Students', 'Exams', 'Practice Labs', 'Projects']}
    />
  );
}
