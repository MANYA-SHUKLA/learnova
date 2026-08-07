'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { use } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatDifficulty,
  formatLabStatus,
  usePracticeLab,
  useProblemList,
  usePublishPracticeLabMutation,
} from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

export default function InstitutionPracticeLabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const labQuery = usePracticeLab(id);
  const problemsQuery = useProblemList({ practiceLabId: id, limit: 50 });
  const publish = usePublishPracticeLabMutation();
  const lab = labQuery.data;
  const problems = problemsQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.LAB_READ} enforce>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={APP_ROUTES.INSTITUTION_PRACTICE_LABS}>← Back to labs</Link>
        </Button>

        {labQuery.isError ? (
          <ErrorState title="Unable to load practice lab." />
        ) : labQuery.isLoading || !lab ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">Practice Lab</p>
                <h1 className="mt-1 font-display text-2xl font-semibold">{lab.title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {lab.description || 'No description'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{formatLabStatus(lab.status)}</Badge>
                  <Badge variant="outline">{formatDifficulty(lab.difficulty)}</Badge>
                  <Badge variant="secondary">{lab.problemCount} problems</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {lab.status === 'draft' ? (
                  <Button onClick={() => publish.mutate(lab.id)} disabled={publish.isPending}>
                    Publish
                  </Button>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href={`/institution/practice-labs/${lab.id}/problems`}>Manage problems</Link>
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Problems</CardTitle>
                <CardDescription>Problems in this practice lab.</CardDescription>
              </CardHeader>
              <CardContent>
                {problems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No problems yet.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {problems.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDifficulty(p.difficulty)} · {p.tags.join(', ') || 'untagged'}
                          </p>
                        </div>
                        <Badge variant="outline">{p.slug}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
