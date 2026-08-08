'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { useExamList } from '@/features/examination';
import { Link } from '@/lib/i18n/routing';

export default function FacultyProctoringPage() {
  const t = useTranslations('dashboard.faculty.proctoring');
  const listQuery = useExamList({ status: 'in_progress', page: 1, limit: 20 });
  const exams = listQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.EXAMINATION_PROCTOR} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('activeTitle')}</CardTitle>
            <CardDescription>{t('activeDescription')}</CardDescription>
          </CardHeader>
          <div className="space-y-3 p-4 pt-0">
            {exams.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noActive')}</p>
            ) : (
              exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-xl border border-border/80 p-4"
                >
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('secureBrowser')}: {exam.proctoring.secureBrowser}
                    </p>
                  </div>
                  <Button variant="default" size="sm" asChild>
                    <Link href={`${APP_ROUTES.FACULTY_EXAMS_LIVE}?examId=${exam.id}`}>
                      {t('monitor')}
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PermissionGate>
  );
}
