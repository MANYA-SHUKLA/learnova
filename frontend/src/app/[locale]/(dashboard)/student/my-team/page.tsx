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
  Skeleton,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatTeamStatus,
  STUDENT_MY_TEAM,
  useAcceptInvitationMutation,
  useMyTeamList,
  useRejectInvitationMutation,
} from '@/features/project';
import { Link } from '@/lib/i18n/routing';

export default function StudentMyTeamPage() {
  const t = useTranslations('dashboard.student.projects');
  const [page, setPage] = useState(1);
  const teamsQuery = useMyTeamList({ page, limit: 20 });
  const acceptInvitation = useAcceptInvitationMutation();
  const rejectInvitation = useRejectInvitationMutation();

  const entries = teamsQuery.data?.items ?? [];
  const meta = teamsQuery.data?.meta;

  return (
    <PermissionGate permission={PERMISSIONS.PROJECT_READ} enforce>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href={APP_ROUTES.STUDENT_PROJECTS}>{t('back')}</Link>
          </Button>
          <p className="text-sm font-medium text-primary">{t('teamsPageEyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('teamsPageTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('teamsPageDescription')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">{t('teamsListTitle')}</CardTitle>
            <CardDescription>{t('teamsListDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {teamsQuery.isError ? (
              <ErrorState message={t('error')} />
            ) : teamsQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : entries.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('noTeamsTitle')}
                description={t('noTeamsPageDescription')}
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border">
                {entries.map((entry) => (
                  <li
                    key={`${entry.projectId}-${entry.teamId}`}
                    className="flex flex-col gap-3 px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{entry.teamName}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.projectTitle} · {entry.memberCount} {t('members')}
                        </p>
                        {entry.members?.length ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('memberList', {
                              count: entry.members.length,
                            })}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatTeamStatus(entry.status)}
                        </Badge>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${APP_ROUTES.STUDENT_PROJECTS}/${entry.projectId}`}>
                            {t('openProject')}
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {entry.pendingInvitations?.length ? (
                      <div className="rounded-lg border border-dashed border-border/80 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          {t('pendingInvitations')}
                        </p>
                        <ul className="space-y-2">
                          {entry.pendingInvitations.map((inv) => (
                            <li
                              key={inv.id}
                              className="flex flex-wrap items-center gap-2 text-sm"
                            >
                              <span className="text-muted-foreground">{inv.id.slice(-6)}</span>
                              <Button
                                size="sm"
                                disabled={acceptInvitation.isPending}
                                onClick={() => void acceptInvitation.mutateAsync(inv.id)}
                              >
                                {t('acceptInvitation')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rejectInvitation.isPending}
                                onClick={() => void rejectInvitation.mutateAsync(inv.id)}
                              >
                                {t('rejectInvitation')}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
                >
                  {t('previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => { setPage((p) => p + 1); }}
                >
                  {t('next')}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          <Link href={STUDENT_MY_TEAM} className="sr-only">
            {t('teamsPageTitle')}
          </Link>
        </p>
      </div>
    </PermissionGate>
  );
}
