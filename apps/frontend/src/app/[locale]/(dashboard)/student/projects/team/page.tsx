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
import { useQueries } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatTeamStatus,
  projectApi,
  projectKeys,
  useMyProjects,
} from '@/features/project';
import { Link } from '@/lib/i18n/routing';

export default function StudentProjectTeamsPage() {
  const t = useTranslations('dashboard.student.projects');
  const projectsQuery = useMyProjects({ limit: 50 });

  const projects = projectsQuery.data?.items ?? [];

  const teamQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: projectKeys.teams({ projectId: project.id }),
      queryFn: () => projectApi.listTeams({ projectId: project.id, limit: 50 }),
      enabled: Boolean(project.id),
      staleTime: 30_000,
    })),
  });

  const teamsWithProject = useMemo(() => {
    const result: Array<{
      projectId: string;
      projectTitle: string;
      teamId: string;
      teamName: string;
      memberCount: number;
      status: string;
    }> = [];

    projects.forEach((project, index) => {
      const teams = teamQueries[index]?.data?.items ?? [];
      for (const team of teams) {
        result.push({
          projectId: project.id,
          projectTitle: project.title,
          teamId: team.id,
          teamName: team.name,
          memberCount: team.memberCount,
          status: team.status,
        });
      }
    });

    return result;
  }, [projects, teamQueries]);

  const isLoading =
    projectsQuery.isLoading || teamQueries.some((q) => q.isLoading && q.fetchStatus !== 'idle');

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
            {projectsQuery.isError ? (
              <ErrorState message={t('error')} />
            ) : isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : teamsWithProject.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('noTeamsTitle')}
                description={t('noTeamsPageDescription')}
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border">
                {teamsWithProject.map((entry) => (
                  <li
                    key={`${entry.projectId}-${entry.teamId}`}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{entry.teamName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.projectTitle} · {entry.memberCount} {t('members')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{formatTeamStatus(entry.status as 'forming' | 'active' | 'dissolved')}</Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${APP_ROUTES.STUDENT_PROJECTS}/${entry.projectId}`}>
                          {t('openProject')}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
