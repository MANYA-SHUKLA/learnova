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
import { use, useEffect, useState } from 'react';
import { SuccessPopup } from '@/components/shared/success-popup';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatProjectStatus,
  formatProjectType,
  useArchiveProjectMutation,
  useCloseProjectMutation,
  useProject,
  usePublishProjectMutation,
  useUpdateProjectMutation,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

export default function InstitutionProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.institution.projects');
  const tCommon = useTranslations('common');
  const projectQuery = useProject(id);
  const updateMutation = useUpdateProjectMutation();
  const publishMutation = usePublishProjectMutation();
  const archiveMutation = useArchiveProjectMutation();
  const closeMutation = useCloseProjectMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const project = projectQuery.data;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    setDescription(project.description ?? '');
    setInstructions(project.instructions ?? '');
    setTotalMarks(String(project.totalMarks));
    setPassingMarks(String(project.passingMarks));
  }, [project]);

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <div className="space-y-6">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <Button variant="ghost" asChild size="sm" className="-ml-2">
          <Link href={APP_ROUTES.INSTITUTION_PROJECTS}>{t('back')}</Link>
        </Button>

        {projectQuery.isError ? (
          <ErrorState message={t('error')} />
        ) : projectQuery.isLoading || !project ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {project.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{formatProjectStatus(project.status)}</Badge>
                  <Badge variant="outline">{formatProjectType(project.projectType)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('due')}: {formatDueDate(project.dueDate)} · {project.totalMarks} {t('marks')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.status === 'draft' ? (
                  <Button
                    disabled={publishMutation.isPending}
                    onClick={() => void publishMutation.mutateAsync(id)}
                  >
                    {t('publish')}
                  </Button>
                ) : null}
                {project.status === 'published' ? (
                  <Button
                    variant="outline"
                    disabled={closeMutation.isPending}
                    onClick={() => void closeMutation.mutateAsync(id)}
                  >
                    {t('close')}
                  </Button>
                ) : null}
                {project.status !== 'archived' ? (
                  <Button
                    variant="ghost"
                    disabled={archiveMutation.isPending}
                    onClick={() => void archiveMutation.mutateAsync(id)}
                  >
                    {t('archive')}
                  </Button>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${id}/milestones`}>
                    {t('manageMilestones')}
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('editTitle')}</CardTitle>
                <CardDescription>{t('editDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('projectTitle')}</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('totalMarks')}</label>
                    <Input
                      type="number"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('passingMarks')}</label>
                    <Input
                      type="number"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('descriptionLabel')}</label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('instructionsLabel')}</label>
                  <textarea
                    className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
                <Button
                  disabled={updateMutation.isPending || !title.trim()}
                  onClick={async () => {
                    await updateMutation.mutateAsync({
                      id,
                      body: {
                        title: title.trim(),
                        description: description || null,
                        instructions: instructions || null,
                        totalMarks: Number(totalMarks) || project.totalMarks,
                        passingMarks: Number(passingMarks) || project.passingMarks,
                      },
                    });
                    showSuccess(tCommon('savedSuccessfully'));
                  }}
                >
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
