'use client';

import { useTranslations } from 'next-intl';
import { RoleWelcome } from '@/components/shared/role-welcome';

export default function FacultyDashboardPage() {
  const t = useTranslations('dashboard.facultyHome');

  return (
    <RoleWelcome
      roleLabel={t('roleLabel')}
      title={t('title')}
      preparingLine={t('preparingLine')}
      modulesIntro={t('modulesIntro')}
      welcome={t('welcome')}
      welcomeNamed={t('welcomeNamed')}
      contactAdmin={t('contactAdmin')}
      modules={[
        t('modules.myCourses'),
        t('modules.students'),
        t('modules.exams'),
        t('modules.practiceLabs'),
        t('modules.projects'),
      ]}
    />
  );
}
