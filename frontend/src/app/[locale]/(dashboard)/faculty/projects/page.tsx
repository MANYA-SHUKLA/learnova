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
import { useMemo, useState } from 'react';
import { SuccessPopup } from '@/components/shared/success-popup';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDueDate,
  formatProjectStatus,
  formatProjectType,
  formatSubmissionStatus,
  formatTeamStatus,
  useApproveTeamMutation,
  useFacultyProjectDashboard,
  useGradeSubmissionMutation,
  useProjectList,
  usePublishProjectMutation,
  useRejectTeamMutation,
  useSubmissionList,
  useTeamList,
} from '@/features/project';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { Link } from '@/lib/i18n/routing';

export default function FacultyProjectsPage() {
  const t = useTranslations('dashboard.faculty.projects');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<string, string>>({});
  const [gradeSuggestions, setGradeSuggestions] = useState<Record<string, string>>({});
  const [revisionRequired, setRevisionRequired] = useState<Record<string, boolean>>({});
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(tCommon('savedSuccessfully'));

  const params = useMemo(
    () => ({
      q: search || undefined,
      page,
      limit: 20,
      sortBy: 'dueDate',
      sortOrder: 'asc' as const,
    }),
    [search, page],
  );

  const listQuery = useProjectList(params);
  const dashQuery = useFacultyProjectDashboard();
  const pendingTeamsQuery = useTeamList({ pendingApproval: true, limit: 10 });
  const submissionsQuery = useSubmissionList({
    status: 'submitted',
    page: 1,
    limit: 10,
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });
  const lateQuery = useSubmissionList({ late: true, page: 1, limit: 5 });
  const publishMutation = usePublishProjectMutation();
  const gradeMutation = useGradeSubmissionMutation();
  const approveTeam = useApproveTeamMutation();
  const rejectTeam = useRejectTeamMutation();

  const rows = listQuery.data?.items ?? [];
  const dash = dashQuery.data;
  const pendingTeams = pendingTeamsQuery.data?.items ?? [];
  const pending = submissionsQuery.data?.items ?? [];
  const late = lateQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <div className="space-y-8">
        <SuccessPopup open={open} message={message} onClose={closeSuccess} />

        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: t('stats.created'), value: dash?.projectsCreated },
            { label: t('stats.pendingReviews'), value: dash?.pendingReviews },
            { label: t('stats.upcomingDeadlines'), value: dash?.upcomingDeadlines?.length },
            { label: t('stats.studentTeams'), value: dash?.studentTeams },
            { label: t('stats.lateSubmissions'), value: dash?.lateSubmissions ?? late.length },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-border/80">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (stat.value ?? '—')}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('teamApprovalTitle')}</CardTitle>
            <CardDescription>{t('teamApprovalDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noPendingTeams')}</p>
            ) : (
              pendingTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{team.teamName}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.memberCount} {t('members')} · {formatTeamStatus(team.status)}
                    </p>
                  </div>
                  <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={approveTeam.isPending}
                        onClick={async () => {
                          await approveTeam.mutateAsync(team.id);
                          showSuccess(t('teamApproved'));
                        }}
                      >
                        {t('approveTeam')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rejectTeam.isPending}
                        onClick={async () => {
                          await rejectTeam.mutateAsync({ id: team.id });
                          showSuccess(t('teamRejected'));
                        }}
                      >
                        {t('rejectTeam')}
                      </Button>
                    </div>
                  </PermissionGate>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('listTitle')}</CardTitle>
              <CardDescription>{t('listDescription')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                className="sm:w-56"
                value={q}
                onChange={(e) => { setQ(e.target.value); }}
                placeholder={t('searchPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(q.trim());
                    setPage(1);
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearch(q.trim());
                  setPage(1);
                }}
              >
                {t('search')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {listQuery.isError ? (
              <ErrorState message={t('error')} />
            ) : listQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : rows.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.title}</p>
                        <Badge variant="secondary">{formatProjectStatus(row.status)}</Badge>
                        <Badge variant="outline">{formatProjectType(row.projectType)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('due')}: {formatDueDate(row.dueDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${APP_ROUTES.FACULTY_PROJECTS}/${row.id}`}>
                          {t('manage')}
                        </Link>
                      </Button>
                      {row.status === 'draft' ? (
                        <PermissionGate permission={PERMISSIONS.PROJECT_WRITE}>
                          <Button
                            size="sm"
                            disabled={publishMutation.isPending}
                            onClick={() => void publishMutation.mutateAsync(row.id)}
                          >
                            {t('publish')}
                          </Button>
                        </PermissionGate>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('pendingTitle')}</CardTitle>
            <CardDescription>{t('pendingDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noPending')}</p>
            ) : (
              pending.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/80 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{formatSubmissionStatus(sub.status)}</Badge>
                    <span className="text-xs text-muted-foreground">#{sub.attemptNumber}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder={t('marksPlaceholder')}
                    value={gradeMarks[sub.id] ?? ''}
                    onChange={(e) =>
                      { setGradeMarks((prev) => ({ ...prev, [sub.id]: e.target.value })); }
                    }
                  />
                  <Input
                    placeholder={t('feedbackPlaceholder')}
                    value={gradeFeedback[sub.id] ?? ''}
                    onChange={(e) =>
                      { setGradeFeedback((prev) => ({ ...prev, [sub.id]: e.target.value })); }
                    }
                  />
                  <Input
                    placeholder={t('suggestionsPlaceholder')}
                    value={gradeSuggestions[sub.id] ?? ''}
                    onChange={(e) =>
                      { setGradeSuggestions((prev) => ({ ...prev, [sub.id]: e.target.value })); }
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={revisionRequired[sub.id] ?? false}
                      onChange={(e) =>
                        { setRevisionRequired((prev) => ({ ...prev, [sub.id]: e.target.checked })); }
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
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
