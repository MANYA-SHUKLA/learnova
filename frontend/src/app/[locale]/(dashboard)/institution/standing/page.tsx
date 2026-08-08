'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Button, Card, Skeleton } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { PermissionGate } from '@/components/shared/protected-route';
import { useAcademicStandingQuery, useComputeStandingMutation } from '@/features/gradebook';

export default function InstitutionAcademicStandingPage() {
  const t = useTranslations('dashboard.institution.academicStanding');
  const standingQuery = useAcademicStandingQuery();
  const computeMutation = useComputeStandingMutation();
  const rows = standingQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_MANAGE} enforce>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <Button
            disabled={computeMutation.isPending}
            onClick={() => {
              void computeMutation.mutateAsync({});
            }}
          >
            {t('recompute')}
          </Button>
        </div>

        {standingQuery.isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 50).map((row) => (
              <Card key={row.id} className="rounded-2xl border-border/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.standing ?? '—'}</span>
                  <Badge variant="outline">GPA {row.semesterGpa ?? '—'}</Badge>
                  <Badge variant="secondary">CGPA {row.cgpa ?? '—'}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
