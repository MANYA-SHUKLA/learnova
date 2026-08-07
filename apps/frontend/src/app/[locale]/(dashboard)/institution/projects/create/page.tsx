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
import { SuccessPopup } from '@/components/shared/success-popup';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  useCreateProjectMutation,
  useProjectCategories,
  useProjectTags,
} from '@/features/project';
import type { ProjectDifficulty, ProjectTypeSpec } from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link, useRouter } from '@/lib/i18n/routing';

const PROJECT_TYPES: ProjectTypeSpec[] = [
  'mini_project',
  'major_project',
  'capstone',
  'research',
  'case_study',
  'industry_project',
  'innovation_challenge',
  'open_project',
];

const DIFFICULTIES: ProjectDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function CreateProjectPage() {
  const t = useTranslations('dashboard.institution.projects');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const createMutation = useCreateProjectMutation();
  const categoriesQuery = useProjectCategories();
  const tagsQuery = useProjectTags();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(tCommon('savedSuccessfully'));

  const [courseId, setCourseId] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [projectType, setProjectType] = useState<ProjectTypeSpec>('capstone');
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>('intermediate');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minimumTeamSize, setMinimumTeamSize] = useState('2');
  const [maximumTeamSize, setMaximumTeamSize] = useState('5');
  const [totalMarks, setTotalMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [resources, setResources] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categories = categoriesQuery.data?.items ?? [];
  const tags = tagsQuery.data?.items ?? [];

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_WRITE} enforce>
      <div className="mx-auto max-w-3xl space-y-6">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

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
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">{t('courseId')}</label>
                <Input
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder={t('courseIdPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('slug')}</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="capstone-2026" />
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
                  onChange={(e) => setProjectType(e.target.value as ProjectTypeSpec)}
                >
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`types.${type}`, { defaultValue: type })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('difficulty')}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as ProjectDifficulty)}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {t(`difficulties.${d}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('category')}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('objective')}</label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('problemStatement')}</label>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('learningOutcomes')}</label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={learningOutcomes}
                onChange={(e) => setLearningOutcomes(e.target.value)}
                placeholder={t('learningOutcomesPlaceholder')}
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
              <label className="text-sm font-medium">{t('instructionsLabel')}</label>
              <textarea
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            {tags.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('tags')}</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      size="sm"
                      variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('teamSizeMin')}</label>
                <Input type="number" value={minimumTeamSize} onChange={(e) => setMinimumTeamSize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('teamSizeMax')}</label>
                <Input type="number" value={maximumTeamSize} onChange={(e) => setMaximumTeamSize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('totalMarks')}</label>
                <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('passingMarks')}</label>
                <Input type="number" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('startDate')}</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('due')}</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('submissionDeadline')}</label>
                <Input
                  type="date"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('resources')}</label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                placeholder={t('resourcesPlaceholder')}
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
                      slug: slug || null,
                      title,
                      objective: objective || null,
                      problemStatement: problemStatement || null,
                      learningOutcomes: learningOutcomes
                        ? learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean)
                        : [],
                      description: description || null,
                      instructions: instructions || null,
                      projectType,
                      difficulty,
                      categoryId: categoryId || null,
                      tags: selectedTags,
                      minimumTeamSize: Number(minimumTeamSize) || 2,
                      maximumTeamSize: Number(maximumTeamSize) || 5,
                      totalMarks: Number(totalMarks) || 100,
                      passingMarks: Number(passingMarks) || 40,
                      startDate: startDate || null,
                      dueDate: dueDate || null,
                      submissionDeadline: submissionDeadline || null,
                      allowMilestones: true,
                      allowSelfTeamFormation: true,
                      allowRepoLink: true,
                    });
                    showSuccess(tCommon('savedSuccessfully'));
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
