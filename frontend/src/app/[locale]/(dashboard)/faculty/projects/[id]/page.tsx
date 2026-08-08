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
  formatProjectStatus,
  formatProjectType,
  formatSubmissionStatus,
  formatTeamStatus,
  useApproveTeamMutation,
  useCreateCommentMutation,
  useCreateMilestoneMutation,
  useGradeSubmissionMutation,
  useProject,
  useProjectComments,
  useProjectMilestones,
  useRejectTeamMutation,
  useResolveCommentMutation,
  useSubmissionList,
  useTeamList,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

type FacultyTab = 'overview' | 'milestones' | 'teams' | 'submissions' | 'comments' | 'reviews';

export default function FacultyProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.faculty.projects');
  const tCommon = useTranslations('common');
  const [tab, setTab] = useState<FacultyTab>('overview');
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const teamsQuery = useTeamList({ projectId: id, limit: 50 });
  const submissionsQuery = useSubmissionList({ projectId: id, limit: 20 });
  const commentsQuery = useProjectComments({ projectId: id, limit: 50 });
  const createMilestone = useCreateMilestoneMutation();
  const gradeMutation = useGradeSubmissionMutation();
  const approveTeam = useApproveTeamMutation();
  const rejectTeam = useRejectTeamMutation();
  const createComment = useCreateCommentMutation();
  const resolveComment = useResolveCommentMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<string, string>>({});
  const [gradeSuggestions, setGradeSuggestions] = useState<Record<string, string>>({});
  const [revisionRequired, setRevisionRequired] = useState<Record<string, boolean>>({});
  const [commentBody, setCommentBody] = useState('');

  const project = projectQuery.data;
  const milestones = milestonesQuery.data?.items ?? [];
  const teams = teamsQuery.data?.items ?? [];
  const submissions = submissionsQuery.data?.items ?? [];
  const comments = commentsQuery.data?.items ?? [];

  const tabs: FacultyTab[] = ['overview', 'milestones', 'teams', 'submissions', 'comments', 'reviews'];

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <div className="space-y-6">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <Button variant="ghost" asChild size="sm" className="-ml-2">
          <Link href={APP_ROUTES.FACULTY_PROJECTS}>{t('back')}</Link>
        </Button>

        {projectQuery.isError ? (
          <ErrorState message={t('error')} />
        ) : projectQuery.isLoading || !project ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {project.title}
              </h1>
              <Badge variant="secondary">{formatProjectStatus(project.status)}</Badge>
              <Badge variant="outline">{formatProjectType(project.projectType)}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('due')}: {formatDueDate(project.dueDate)} · {project.totalMarks} {t('marks')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {tabs.map((key) => (
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

        {tab === 'overview' && project ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('overviewTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {project.objective ? <p>{project.objective}</p> : null}
              {project.problemStatement ? (
                <p className="text-muted-foreground">{project.problemStatement}</p>
              ) : null}
              <p className="whitespace-pre-wrap">{project.instructions ?? project.description}</p>
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
                    placeholder={t('milestonePlaceholder')}
                  />
                  <Button
                    size="sm"
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
                <p className="text-sm text-muted-foreground">{t('noMilestones')}</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border">
                  {milestones.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{m.title}</span>
                      <Badge variant="outline">{formatMilestoneStatus(m.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {tab === 'teams' ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('teamsTitle')}</CardTitle>
              <CardDescription>{t('teamsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teams.length === 0 ? (
                <EmptyState
                  illustration="inbox"
                  title={t('noTeamsTitle')}
                  description={t('noTeamsDescription')}
                />
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{team.teamName}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.memberCount} {t('members')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{formatTeamStatus(team.status)}</Badge>
                      {team.status === 'pending' ? (
                        <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                          <Button
                            size="sm"
                            disabled={approveTeam.isPending}
                            onClick={() => void approveTeam.mutateAsync(team.id)}
                          >
                            {t('approveTeam')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rejectTeam.isPending}
                            onClick={() => void rejectTeam.mutateAsync({ id: team.id })}
                          >
                            {t('rejectTeam')}
                          </Button>
                        </PermissionGate>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        {tab === 'submissions' ? (
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('submissionsTitle')}</CardTitle>
              <CardDescription>{t('submissionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noSubmissions')}</p>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 rounded-xl border border-border/80 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{formatSubmissionStatus(sub.status)}</Badge>
                      <span className="text-xs text-muted-foreground">#{sub.attemptNumber}</span>
                    </div>
                    {sub.status === 'submitted' || sub.status === 'late' ? (
                      <>
                        <Input
                          type="number"
                          placeholder={t('marksPlaceholder')}
                          value={gradeMarks[sub.id] ?? ''}
                          onChange={(e) =>
                            setGradeMarks((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                        />
                        <Input
                          placeholder={t('feedbackPlaceholder')}
                          value={gradeFeedback[sub.id] ?? ''}
                          onChange={(e) =>
                            setGradeFeedback((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                        />
                        <Input
                          placeholder={t('suggestionsPlaceholder')}
                          value={gradeSuggestions[sub.id] ?? ''}
                          onChange={(e) =>
                            setGradeSuggestions((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={revisionRequired[sub.id] ?? false}
                            onChange={(e) =>
                              setRevisionRequired((prev) => ({
                                ...prev,
                                [sub.id]: e.target.checked,
                              }))
                            }
                          />
                          {t('revisionRequired')}
                        </label>
                        <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                          <Button
                            size="sm"
                            disabled={gradeMutation.isPending || !gradeMarks[sub.id]}
                            onClick={async () => {
                              await gradeMutation.mutateAsync({
                                id: sub.id,
                                body: {
                                  gradingMethod: 'marks',
                                  marksObtained: Number(gradeMarks[sub.id]),
                                  score: Number(gradeMarks[sub.id]),
                                  feedback: gradeFeedback[sub.id] || null,
                                  suggestions: gradeSuggestions[sub.id] || null,
                                  approval: !revisionRequired[sub.id],
                                  revisionRequired: revisionRequired[sub.id] ?? false,
                                },
                              });
                              showSuccess(t('gradedSuccess'));
                            }}
                          >
                            {t('grade')}
                          </Button>
                        </PermissionGate>
                      </>
                    ) : null}
                  </div>
                ))
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
                      await createComment.mutateAsync({ projectId: id, body: commentBody.trim() });
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
                comments.map((c) => (
                  <div key={c.id} className="rounded-xl border p-3 text-sm">
                    <p>{c.body}</p>
                    {!c.resolved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => void resolveComment.mutateAsync({ id: c.id, projectId: id })}
                      >
                        {t('resolveComment')}
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="mt-2">
                        {t('resolved')}
                      </Badge>
                    )}
                  </div>
                ))
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
      </div>
    </PermissionGate>
  );
}
