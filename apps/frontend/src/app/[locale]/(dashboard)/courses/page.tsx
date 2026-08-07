'use client';

import { useTranslations } from 'next-intl';
import { RoleWelcome } from '@/components/shared/role-welcome';

export default function CoursesPlaceholderPage() {
  const t = useTranslations('dashboard.courses');

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
        t('modules.catalog'),
        t('modules.enrollments'),
        t('modules.schedules'),
        t('modules.materials'),
        t('modules.assessments'),
      ]}
    />
  );
}
