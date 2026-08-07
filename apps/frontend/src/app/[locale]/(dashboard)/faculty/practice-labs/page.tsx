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
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDifficulty,
  formatLabStatus,
  useFacultyPracticeDashboard,
  usePracticeLabList,
  usePublishPracticeLabMutation,
} from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

export default function FacultyPracticeLabsPage() {
  const listQuery = usePracticeLabList({ limit: 50 });
  const dashQuery = useFacultyPracticeDashboard();
  const publish = usePublishPracticeLabMutation();
  const rows = listQuery.data?.items ?? [];
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.LAB_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Practice Labs</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Your coding labs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create problems, review attempts, and track success rates.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Labs created', value: dash?.labsCreated },
            { label: 'Problems', value: dash?.problems },
            { label: 'Student attempts', value: dash?.studentAttempts },
            {
              label: 'Avg success',
              value: dash ? `${dash.averageSuccessRate}%` : undefined,
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (stat.value ?? '—')}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Labs</CardTitle>
              <CardDescription>Labs you own.</CardDescription>
            </div>
            <Button asChild>
              <Link href={APP_ROUTES.INSTITUTION_PRACTICE_LABS_CREATE}>Create lab</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {listQuery.isError ? (
              <ErrorState message="Unable to load labs." />
            ) : listQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : rows.length === 0 ? (
              <EmptyState title="No labs yet" description="Create a practice lab for your course." />
            ) : (
              <ul className="divide-y divide-border/60">
                {rows.map((lab) => (
                  <li key={lab.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{lab.title}</p>
                      <div className="mt-1 flex gap-2 text-xs">
                        <Badge variant="secondary">{formatLabStatus(lab.status)}</Badge>
                        <Badge variant="outline">{formatDifficulty(lab.difficulty)}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {lab.status === 'draft' ? (
                        <Button size="sm" onClick={() => publish.mutate(lab.id)}>
                          Publish
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/institution/practice-labs/${lab.id}/problems`}>Problems</Link>
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
