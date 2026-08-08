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
  formatProjectType,
  formatTeamStatus,
  useCreateCommentMutation,
  useCreateReviewMutation,
  useCreateTeamMutation,
  useInviteToTeamMutation,
  useJoinTeamMutation,
  useLeaveTeamMutation,
  useProject,
  useProjectComments,
  useProjectMilestones,
  useSaveDraftMutation,
  useSubmissionList,
  useSubmitProjectMutation,
  useSubmitReviewMutation,
  useTeamList,
  useTransferTeamLeadershipMutation,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

type StudentTab = 'overview' | 'timeline' | 'milestones' | 'team' | 'submit' | 'comments' | 'reviews';

export default function StudentProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.student.projects');
  const tCommon = useTranslations('common');
  const [tab, setTab] = useState<StudentTab>('overview');
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const teamsQuery = useTeamList({ projectId: id, limit: 50 });
  const submissionsQuery = useSubmissionList({ projectId: id, limit: 10 });
  const commentsQuery = useProjectComments({ projectId: id, limit: 50 });
  const saveDraft = useSaveDraftMutation();
  const submit = useSubmitProjectMutation();
  const createTeam = useCreateTeamMutation();
  const joinTeam = useJoinTeamMutation();
  const leaveTeam = useLeaveTeamMutation();
  const inviteToTeam = useInviteToTeamMutation();
  const transferLeadership = useTransferTeamLeadershipMutation();
  const createReview = useCreateReviewMutation();
  const submitReview = useSubmitReviewMutation();
  const createComment = useCreateCommentMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const [text, setText] = useState('');
  const [github, setGithub] = useState('');
  const [demoVideo, setDemoVideo] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [inviteStudentId, setInviteStudentId] = useState('');
  const [transferStudentId, setTransferStudentId] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewRating, setReviewRating] = useState('8');
  const [reviewSubmissionId, setReviewSubmissionId] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const project = projectQuery.data;
  const milestones = milestonesQuery.data?.items ?? [];
  const teams = teamsQuery.data?.items ?? [];
  const submissions = submissionsQuery.data?.items ?? [];
  const comments = commentsQuery.data?.items ?? [];
  const myTeam = teams[0];

  const tabs: StudentTab[] = ['overview', 'timeline', 'milestones', 'team', 'submit', 'comments', 'reviews'];

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_WRITE} enforce>
      <div className="space-y-6">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href={APP_ROUTES.STUDENT_PROJECTS}>{t('back')}</Link>
          </Button>
          {projectQuery.isLoading ? (
            <Skeleton className="h-10 w-2/3" />
          ) : projectQuery.isError || !project ? (
            <ErrorState message={t('error')} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {project.title}
                </h1>
                <Badge variant="outline">{formatProjectType(project.projectType)}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('due')}: {formatDueDate(project.dueDate)} · {project.totalMarks} {t('marks')}
              </p>
            </>
          )}
        </div>

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

        {project ? (
          <>
            {tab === 'overview' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('instructions')}</CardTitle>
                  <CardDescription>{project.description ?? t('noDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {project.objective ? <p>{project.objective}</p> : null}
                  {project.problemStatement ? (
                    <p className="text-muted-foreground">{project.problemStatement}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap">{project.instructions ?? t('noInstructions')}</p>
                </CardContent>
              </Card>
            ) : null}

            {tab === 'timeline' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('tabs.timeline')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    {t('startDate')}: {formatDueDate(project.startDate ?? project.publishDate)}
                  </p>
                  <p>
                    {t('due')}: {formatDueDate(project.dueDate)}
                  </p>
                  <p>
                    {t('submissionDeadline')}:{' '}
                    {formatDueDate(project.submissionDeadline ?? project.closeDate)}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {tab === 'milestones' && project.allowMilestones ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('milestonesTitle')}</CardTitle>
                  <CardDescription>{t('milestonesDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noMilestones')}</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border">
                      {milestones.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <span>{m.title}</span>
                          <Badge variant="outline">{formatMilestoneStatus(m.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'team' && project.allowTeams ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('teamTitle')}</CardTitle>
                  <CardDescription>{t('teamDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teams.length === 0 ? (
                    <EmptyState
                      illustration="inbox"
                      title={t('noTeamsTitle')}
                      description={t('noTeamsDescription')}
                    />
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border">
                      {teams.map((team) => (
                        <li
                          key={team.id}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{team.teamName}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.memberCount} / {project.maximumTeamSize} {t('members')}
                            </p>
                          </div>
                          <Badge variant="outline">{formatTeamStatus(team.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}

                  {project.allowSelfTeamFormation ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('createTeam')}</label>
                        <Input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder={t('teamNamePlaceholder')}
                        />
                        <Button
                          size="sm"
                          disabled={createTeam.isPending || !teamName.trim()}
                          onClick={async () => {
                            await createTeam.mutateAsync({
                              projectId: id,
                              teamName: teamName.trim(),
                              repoLink: github || null,
                            });
                            setTeamName('');
                            showSuccess(tCommon('savedSuccessfully'));
                          }}
                        >
                          {t('createTeamSubmit')}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('joinTeam')}</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                        >
                          <option value="">{t('selectTeam')}</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.teamName}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={joinTeam.isPending || !selectedTeamId}
                          onClick={async () => {
                            await joinTeam.mutateAsync({ teamId: selectedTeamId });
                            showSuccess(tCommon('savedSuccessfully'));
                          }}
                        >
                          {t('joinTeamSubmit')}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {myTeam ? (
                    <div className="space-y-3 rounded-xl border border-border/80 p-3">
                      <p className="text-sm font-medium">{t('manageTeam')}</p>
                      <div className="flex flex-wrap gap-2">
                        <Input
                          className="max-w-xs"
                          placeholder={t('inviteStudentId')}
                          value={inviteStudentId}
                          onChange={(e) => setInviteStudentId(e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={inviteToTeam.isPending || !inviteStudentId.trim()}
                          onClick={async () => {
                            await inviteToTeam.mutateAsync({
                              id: myTeam.id,
                              body: { studentId: inviteStudentId.trim() },
                            });
                            setInviteStudentId('');
                            showSuccess(t('inviteSent'));
                          }}
                        >
                          {t('inviteMember')}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Input
                          className="max-w-xs"
                          placeholder={t('transferStudentId')}
                          value={transferStudentId}
                          onChange={(e) => setTransferStudentId(e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={transferLeadership.isPending || !transferStudentId.trim()}
                          onClick={async () => {
                            await transferLeadership.mutateAsync({
                              id: myTeam.id,
                              body: { studentId: transferStudentId.trim() },
                            });
                            setTransferStudentId('');
                            showSuccess(t('leadershipTransferred'));
                          }}
                        >
                          {t('transferLeadership')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={leaveTeam.isPending}
                          onClick={async () => {
                            await leaveTeam.mutateAsync(myTeam.id);
                            showSuccess(t('leftTeam'));
                          }}
                        >
                          {t('leaveTeam')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'submit' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('submitTitle')}</CardTitle>
                  <CardDescription>{t('submitDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={8}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('textPlaceholder')}
                  />
                  {project.allowRepoLink ? (
                    <Input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder={t('githubPlaceholder')}
                    />
                  ) : null}
                  <Input
                    value={demoVideo}
                    onChange={(e) => setDemoVideo(e.target.value)}
                    placeholder={t('demoVideoPlaceholder')}
                  />
                  <Input
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder={t('liveDemoPlaceholder')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={saveDraft.isPending || !text.trim()}
                      onClick={async () => {
                        await saveDraft.mutateAsync({
                          projectId: id,
                          deliveryType: 'mixed',
                          textSubmission: text,
                          repoLink: github || null,
                          githubRepository: github || null,
                          demoVideo: demoVideo || null,
                          liveDemoURL: liveDemoUrl || null,
                        });
                        showSuccess(tCommon('savedSuccessfully'));
                      }}
                    >
                      {t('saveDraft')}
                    </Button>
                    <Button
                      disabled={submit.isPending || !text.trim()}
                      onClick={async () => {
                        await submit.mutateAsync({
                          projectId: id,
                          deliveryType: 'mixed',
                          textSubmission: text,
                          repoLink: github || null,
                          githubRepository: github || null,
                          demoVideo: demoVideo || null,
                          liveDemoURL: liveDemoUrl || null,
                        });
                        showSuccess(t('submitSuccess'));
                      }}
                    >
                      {t('submit')}
                    </Button>
                  </div>
                  {submissions.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t('submissionHistoryCount', { count: submissions.length })}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'comments' ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('commentsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noComments')}</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="rounded-xl border p-3 text-sm">
                        <p>{c.body}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'reviews' && project.allowPeerReview ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">{t('peerReviewTitle')}</CardTitle>
                  <CardDescription>{t('peerReviewDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={reviewSubmissionId}
                    onChange={(e) => setReviewSubmissionId(e.target.value)}
                    placeholder={t('submissionIdPlaceholder')}
                  />
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder={t('reviewFeedbackPlaceholder')}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    placeholder={t('reviewRatingPlaceholder')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={createReview.isPending || !reviewSubmissionId}
                      onClick={async () => {
                        const review = await createReview.mutateAsync({
                          projectId: id,
                          submissionId: reviewSubmissionId,
                          reviewType: 'peer',
                          rating: Number(reviewRating) || null,
                          score: Number(reviewRating) || null,
                          feedback: reviewFeedback || null,
                        });
                        setActiveReviewId(review.id);
                        showSuccess(tCommon('savedSuccessfully'));
                      }}
                    >
                      {t('startReview')}
                    </Button>
                    {activeReviewId ? (
                      <Button
                        size="sm"
                        disabled={submitReview.isPending}
                        onClick={async () => {
                          await submitReview.mutateAsync({
                            id: activeReviewId,
                            body: {
                              rating: Number(reviewRating) || null,
                              score: Number(reviewRating) || null,
                              feedback: reviewFeedback || null,
                            },
                          });
                          showSuccess(t('reviewSubmitted'));
                        }}
                      >
                        {t('submitReview')}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </PermissionGate>
  );
}
