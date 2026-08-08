'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { CourseSelect } from '@/components/shared/entity-selects';
import {
  useApproveModerationMutation,
  usePublishModerationMutation,
  useSubmitModerationMutation,
} from '@/features/gradebook';

export default function InstitutionGradebookModerationPage() {
  const t = useTranslations('dashboard.institution.gradebookModeration');
  const [courseId, setCourseId] = useState('');
  const submitMutation = useSubmitModerationMutation();
  const approveMutation = useApproveModerationMutation();
  const publishMutation = usePublishModerationMutation();

  return (
    <PermissionGate permission={PERMISSIONS.GRADEBOOK_WRITE} enforce>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('workflowTitle')}</CardTitle>
            <CardDescription>{t('workflowDescription')}</CardDescription>
          </CardHeader>
          <div className="space-y-4 p-4 pt-0">
            <CourseSelect value={courseId} onChange={setCourseId} label={t('course')} />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!courseId || submitMutation.isPending}
                onClick={() => {
                  void submitMutation.mutateAsync({ courseId });
                }}
              >
                {t('submit')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!courseId || approveMutation.isPending}
                onClick={() => {
                  void approveMutation.mutateAsync({ courseId });
                }}
              >
                {t('approve')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!courseId || publishMutation.isPending}
                onClick={() => {
                  void publishMutation.mutateAsync({ courseId });
                }}
              >
                {t('publish')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PermissionGate>
  );
}
