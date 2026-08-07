'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { useCreateProjectMutation } from '@/features/project';
import type { ProjectType } from '@/features/project';
import { Link, useRouter } from '@/lib/i18n/routing';

const PROJECT_TYPES: ProjectType[] = ['individual', 'team', 'hybrid'];

export default function CreateProjectPage() {
  const t = useTranslations('dashboard.institution.projects');
  const router = useRouter();
  const createMutation = useCreateProjectMutation();

  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('team');
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [error, setError] = useState<string | null>(null);

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_WRITE} enforce>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('createTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('createDescription')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle>{t('formTitle')}</CardTitle>
            <CardDescription>{t('formDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('courseId')}</label>
              <Input
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder={t('courseIdPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('projectTitle')}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('projectTitlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('projectType')}</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
              >
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
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
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                disabled={createMutation.isPending || !courseId || !title}
                onClick={async () => {
                  setError(null);
                  try {
                    const project = await createMutation.mutateAsync({
                      courseId,
                      title,
                      description: description || null,
                      instructions: instructions || null,
                      projectType,
                      totalMarks: Number(totalMarks) || 100,
                      passingMarks: Number(passingMarks) || 40,
                    });
                    router.push(`${APP_ROUTES.INSTITUTION_PROJECTS}/${project.id}`);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : t('createError'));
                  }
                }}
              >
                {t('createSubmit')}
              </Button>
              <Button variant="outline" asChild>
                <Link href={APP_ROUTES.INSTITUTION_PROJECTS}>{t('cancel')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
