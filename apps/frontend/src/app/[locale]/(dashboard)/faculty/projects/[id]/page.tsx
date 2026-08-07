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
  useCreateMilestoneMutation,
  useGradeSubmissionMutation,
  useProject,
  useProjectMilestones,
  useSubmissionList,
  useTeamList,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

export default function FacultyProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.faculty.projects');
  const tCommon = useTranslations('common');
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const teamsQuery = useTeamList({ projectId: id, limit: 50 });
  const submissionsQuery = useSubmissionList({ projectId: id, limit: 20 });
  const createMilestone = useCreateMilestoneMutation();
  const gradeMutation = useGradeSubmissionMutation();
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(
    tCommon('savedSuccessfully'),
  );

  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});

  const project = projectQuery.data;
  const milestones = milestonesQuery.data?.items ?? [];
  const teams = teamsQuery.data?.items ?? [];
  const submissions = submissionsQuery.data?.items ?? [];

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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('milestonesTitle')}</CardTitle>
              <CardDescription>{t('milestonesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="rounded-2xl border-border/80">
            <CardHeader>
              <CardTitle className="text-base">{t('teamsTitle')}</CardTitle>
              <CardDescription>{t('teamsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
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
        </div>

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
                  {sub.status === 'submitted' ? (
                    <>
                      <Input
                        type="number"
                        placeholder={t('marksPlaceholder')}
                        value={gradeMarks[sub.id] ?? ''}
                        onChange={(e) =>
                          setGradeMarks((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={gradeMutation.isPending || !gradeMarks[sub.id]}
                        onClick={() =>
                          void gradeMutation.mutateAsync({
                            id: sub.id,
                            body: {
                              gradingMethod: 'marks',
                              marksObtained: Number(gradeMarks[sub.id]),
                              feedback: 'Graded',
                            },
                          })
                        }
                      >
                        {t('grade')}
                      </Button>
                    </>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
