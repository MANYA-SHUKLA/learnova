'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { useAcademicStandingQuery } from '@/features/gradebook';

export default function StudentAcademicStandingPage() {
  const t = useTranslations('dashboard.student.academicStanding');
  const standingQuery = useAcademicStandingQuery();
  const rows = standingQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_READ} enforce>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {standingQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : rows.length === 0 ? (
          <Card className="rounded-2xl border-border/80 p-6">
            <CardDescription>{t('empty')}</CardDescription>
          </Card>
        ) : (
          rows.map((row) => (
            <Card key={row.id} className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base capitalize">
                  {(row.standing ?? '—').replaceAll('_', ' ')}
                </CardTitle>
                <CardDescription>
                  {t('semesterGpa')}: {row.semesterGpa ?? '—'} · {t('cgpa')}: {row.cgpa ?? '—'}
                </CardDescription>
                <Badge variant="outline">
                  {t('failedCourses')}: {row.failedCourseCount ?? 0}
                </Badge>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </PermissionGate>
  );
}
