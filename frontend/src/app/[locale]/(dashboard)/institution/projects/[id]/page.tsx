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
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatMilestoneStatus,
  formatProjectDifficulty,
  formatProjectStatus,
  formatProjectType,
  formatSubmissionStatus,
  formatTeamStatus,
  useArchiveProjectMutation,
  useCloseProjectMutation,
  useCreateCommentMutation,
  useCreateMilestoneMutation,
  useProject,
  useProjectComments,
  useProjectMilestones,
  usePublishProjectMutation,
  useResolveCommentMutation,
  useSubmissionList,
  useTeamList,
  useUpdateProjectMutation,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

type DetailTab =
  | 'overview'
  | 'milestones'
  | 'resources'
  | 'teams'
  | 'submissions'
  | 'comments'
  | 'reviews';

const TABS: DetailTab[] = [
  'overview',
  'milestones',
  'resources',
  'teams',
  'submissions',
  'comments',
  'reviews',
];

export default function InstitutionProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.institution.projects');
  const tCommon = useTranslations('common');
  const [tab, setTab] = useState<DetailTab>('overview');
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const teamsQuery = useTeamList({ projectId: id, limit: 50 });
  const submissionsQuery = useSubmissionList({ projectId: id, limit: 20 });
  const commentsQuery = useProjectComments({ projectId: id, limit: 50 });
  const updateMutation = useUpdateProjectMutation();
  const publishMutation = usePublishProjectMutation();
  const archiveMutation = useArchiveProjectMutation();
  const closeMutation = useCloseProjectMutation();
  const createMilestone = useCreateMilestoneMutation();
  const createComment = useCreateCommentMutation();
  const resolveComment = useResolveCommentMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const project = projectQuery.data;
  const milestones = milestonesQuery.data?.items ?? [];
  const teams = teamsQuery.data?.items ?? [];
  const submissions = submissionsQuery.data?.items ?? [];
  const comments = commentsQuery.data?.items ?? [];

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [objective, setObjective] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    setSlug(project.slug ?? '');
    setObjective(project.objective ?? '');
    setProblemStatement(project.problemStatement ?? '');
    setLearningOutcomes((project.learningOutcomes ?? []).join('\n'));
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
                  {project.difficulty ? (
                    <Badge variant="outline">{formatProjectDifficulty(project.difficulty)}</Badge>
                  ) : null}
                  {project.categoryId ? (
                    <Badge variant="outline">{project.categoryId}</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('due')}: {formatDueDate(project.dueDate)} · {project.totalMarks} {t('marks')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
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
                </PermissionGate>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-border pb-2">
              {TABS.map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={tab === key ? 'default' : 'ghost'}
                  onClick={() => setTab(key)}
                >
                  {t(`tabs.${key}`)}
                </Button>
              ))}
            </div>

            {tab === 'overview' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('editTitle')}</CardTitle>
                  <CardDescription>{t('editDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('slug')}</label>
                      <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('projectTitle')}</label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('totalMarks')}</label>
                      <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('passingMarks')}</label>
                      <Input type="number" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} />
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
                  {project.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tagId) => (
                        <Badge key={tagId} variant="outline">
                          {tagId}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                    <Button
                      disabled={updateMutation.isPending || !title.trim()}
                      onClick={async () => {
                        await updateMutation.mutateAsync({
                          id,
                          body: {
                            slug: slug || undefined,
                            title: title.trim(),
                            objective: objective || null,
                            problemStatement: problemStatement || null,
                            learningOutcomes: learningOutcomes
                              ? learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean)
                              : [],
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
                  </PermissionGate>
                </CardContent>
              </Card>
            ) : null}

            {tab === 'milestones' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('milestonesTitle')}</CardTitle>
                  <CardDescription>{t('milestonesDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                    <div className="flex gap-2">
                      <Input
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        placeholder={t('milestoneTitlePlaceholder')}
                      />
                      <Button
                        disabled={createMilestone.isPending || !milestoneTitle.trim()}
                        onClick={async () => {
                          await createMilestone.mutateAsync({
                            projectId: id,
                            title: milestoneTitle.trim(),
                          });
                          setMilestoneTitle('');
                          showSuccess(tCommon('savedSuccessfully'));
                        }}
                      >
                        {t('addMilestone')}
                      </Button>
                    </div>
                  </PermissionGate>
                  {milestones.length === 0 ? (
                    <EmptyState
                      illustration="inbox"
                      title={t('noMilestonesTitle')}
                      description={t('noMilestonesDescription')}
                    />
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border">
                      {milestones.map((m) => (
                        <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <span>{m.title}</span>
                          <Badge variant="outline">{formatMilestoneStatus(m.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button variant="outline" asChild size="sm">
                    <Link href={`${APP_ROUTES.INSTITUTION_PROJECTS}/${id}/milestones`}>
                      {t('manageMilestones')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {tab === 'resources' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.resources')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.resources?.length ? (
                    <ul className="divide-y divide-border rounded-xl border">
                      {project.resources.map((resource) => (
                        <li key={resource.id} className="px-4 py-3 text-sm">
                          <p className="font-medium">{resource.title}</p>
                          {resource.url ? (
                            <a href={resource.url} className="text-xs text-primary hover:underline" target="_blank" rel="noreferrer">
                              {resource.url}
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : project.attachments?.length ? (
                    <ul className="divide-y divide-border rounded-xl border">
                      {project.attachments.map((file) => (
                        <li key={file.id} className="px-4 py-3 text-sm">
                          <p className="font-medium">{file.fileName}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noResources')}</p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'teams' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.teams')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noTeams')}</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border">
                      {teams.map((team) => (
                        <li key={team.id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">{team.teamName}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.memberCount} {t('members')}
                            </p>
                          </div>
                          <Badge variant="outline">{formatTeamStatus(team.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'submissions' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.submissions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noSubmissions')}</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border">
                      {submissions.map((sub) => (
                        <li key={sub.id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <span>#{sub.attemptNumber}</span>
                          <Badge variant="outline">{formatSubmissionStatus(sub.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'comments' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.comments')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                    <div className="flex gap-2">
                      <Input
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder={t('commentPlaceholder')}
                      />
                      <Button
                        disabled={createComment.isPending || !commentBody.trim()}
                        onClick={async () => {
                          await createComment.mutateAsync({
                            projectId: id,
                            body: commentBody.trim(),
                          });
                          setCommentBody('');
                          showSuccess(tCommon('savedSuccessfully'));
                        }}
                      >
                        {t('addComment')}
                      </Button>
                    </div>
                  </PermissionGate>
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noComments')}</p>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((c) => (
                        <li key={c.id} className="rounded-xl border border-border/80 p-3 text-sm">
                          <p>{c.body}</p>
                          <div className="mt-2 flex items-center gap-2">
                            {c.resolved ? (
                              <Badge variant="secondary">{t('resolved')}</Badge>
                            ) : (
                              <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={resolveComment.isPending}
                                  onClick={() =>
                                    void resolveComment.mutateAsync({ id: c.id, projectId: id })
                                  }
                                >
                                  {t('resolveComment')}
                                </Button>
                              </PermissionGate>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'reviews' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.reviews')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t('reviewsHint')}</p>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </PermissionGate>
  );
}
