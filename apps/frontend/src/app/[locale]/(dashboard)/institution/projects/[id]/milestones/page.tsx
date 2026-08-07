'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { use, useState } from 'react';
import { SuccessPopup } from '@/components/shared/success-popup';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatMilestoneStatus,
  useCreateMilestoneMutation,
  useDeleteMilestoneMutation,
  useProject,
  useProjectMilestones,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

export default function InstitutionProjectMilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.institution.projects');
  const tCommon = useTranslations('common');
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const createMutation = useCreateMilestoneMutation();
  const deleteMutation = useDeleteMilestoneMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('0');

  const project = projectQuery.data;
  const milestones = milestonesQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_WRITE} enforce>
      <div className="space-y-6">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <Button variant="ghost" asChild size="sm" className="-ml-2">
          <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${id}`}>{t('back')}</Link>
        </Button>

        <div>
          <p className="text-sm font-medium text-primary">{t('milestonesEyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('milestonesTitle')}
          </h1>
          {project ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {project.title} · {t('milestonesDescription')}
            </p>
          ) : null}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('addMilestone')}</CardTitle>
            <CardDescription>{t('addMilestoneDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('milestoneTitle')}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('milestoneTitlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('descriptionLabel')}</label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('milestoneWeight')}</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <Button
              disabled={createMutation.isPending || !title.trim()}
              onClick={async () => {
                await createMutation.mutateAsync({
                  projectId: id,
                  title: title.trim(),
                  description: description || null,
                  weight: Number(weight) || 0,
                });
                setTitle('');
                setDescription('');
                setWeight('0');
                showSuccess(tCommon('savedSuccessfully'));
              }}
            >
              {t('addMilestoneSubmit')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('milestonesListTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {milestonesQuery.isError ? (
              <ErrorState message={t('error')} />
            ) : milestonesQuery.isLoading || projectQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : milestones.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('noMilestonesTitle')}
                description={t('noMilestonesDescription')}
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border/80">
                {milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{m.title}</p>
                        <Badge variant="secondary">{formatMilestoneStatus(m.status)}</Badge>
                        {m.weight > 0 ? (
                          <Badge variant="outline">{m.weight}%</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(m.dueDate)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteMutation.isPending}
                      onClick={() =>
                        void deleteMutation.mutateAsync({ id: m.id, projectId: id })
                      }
                    >
                      {t('delete')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
