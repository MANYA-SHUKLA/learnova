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
  useCreateReviewMutation,
  useCreateTeamMutation,
  useJoinTeamMutation,
  useProject,
  useProjectMilestones,
  useSaveDraftMutation,
  useSubmitProjectMutation,
  useSubmitReviewMutation,
  useTeamList,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

export default function StudentProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.student.projects');
  const tCommon = useTranslations('common');
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const teamsQuery = useTeamList({ projectId: id, limit: 50 });
  const saveDraft = useSaveDraftMutation();
  const submit = useSubmitProjectMutation();
  const createTeam = useCreateTeamMutation();
  const joinTeam = useJoinTeamMutation();
  const createReview = useCreateReviewMutation();
  const submitReview = useSubmitReviewMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const [text, setText] = useState('');
  const [repoLink, setRepoLink] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewRating, setReviewRating] = useState('8');
  const [reviewSubmissionId, setReviewSubmissionId] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const project = projectQuery.data;
  const milestones = milestonesQuery.data?.items ?? [];
  const teams = teamsQuery.data?.items ?? [];

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

        {project ? (
          <>
            <Card className="rounded-2xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">{t('instructions')}</CardTitle>
                <CardDescription>{project.description ?? t('noDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {project.instructions ?? t('noInstructions')}
                </p>
              </CardContent>
            </Card>

            {project.allowMilestones ? (
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

            {project.projectType !== 'individual' ? (
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
                            <p className="font-medium">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.memberCount} / {project.teamSizeMax} {t('members')}
                            </p>
                          </div>
                          <Badge variant="outline">{formatTeamStatus(team.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  {project.allowSelfTeamFormation ? (
                    <div className="grid gap-4 sm:grid-cols-2">
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
                              name: teamName.trim(),
                              repoLink: repoLink || null,
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
                              {team.name}
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
                </CardContent>
              </Card>
            ) : null}

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
                    value={repoLink}
                    onChange={(e) => setRepoLink(e.target.value)}
                    placeholder={t('repoPlaceholder')}
                  />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={saveDraft.isPending || !text.trim()}
                    onClick={async () => {
                      await saveDraft.mutateAsync({
                        projectId: id,
                        deliveryType: 'mixed',
                        textSubmission: text,
                        repoLink: repoLink || null,
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
                        repoLink: repoLink || null,
                      });
                      showSuccess(t('submitSuccess'));
                    }}
                  >
                    {t('submit')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {project.allowPeerReview ? (
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
