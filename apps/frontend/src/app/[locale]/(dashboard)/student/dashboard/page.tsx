'use client';

import { useTranslations } from 'next-intl';
import { RoleWelcome } from '@/components/shared/role-welcome';

export default function StudentDashboardPage() {
  const t = useTranslations('dashboard.studentHome');

  return (
    <RoleWelcome
      roleLabel={t('roleLabel')}
      title={t('title')}
      preparingLine={t('preparingLine')}
      modulesIntro={t('modulesIntro')}
      welcome={t('welcome')}
      welcomeNamed={(name) => t('welcomeNamed', { name })}
      contactAdmin={t('contactAdmin')}
      modules={[
        t('modules.myCourses'),
        t('modules.assignments'),
        t('modules.exams'),
        t('modules.practiceLabs'),
        t('modules.projects'),
      ]}
    />
  );
}
