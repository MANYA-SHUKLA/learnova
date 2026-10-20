'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseImportPanel } from '@/features/course/components/course-import-panel';
import { Link } from '@/lib/i18n/routing';

export default function CourseImportPage() {
  const t = useTranslations('dashboard.institution.courses.import');
  const tCommon = useTranslations('common');

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_MANAGE} enforce>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <CourseImportPanel />

        <Button asChild variant="outline">
          <Link href={APP_ROUTES.INSTITUTION_COURSES}>{tCommon('cancel')}</Link>
        </Button>
      </div>
    </PermissionGate>
  );
}
