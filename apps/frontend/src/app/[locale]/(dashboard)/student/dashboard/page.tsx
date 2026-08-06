'use client';

import { RoleWelcome } from '@/components/shared/role-welcome';

export default function StudentDashboardPage() {
  return (
    <RoleWelcome
      roleLabel="Student"
      title="Student Dashboard"
      preparingLine="Your learning workspace is being prepared."
      modulesIntro="The following modules will appear automatically once you are enrolled in courses."
      modules={['My Courses', 'Assignments', 'Exams', 'Practice Labs', 'Projects']}
    />
  );
}
