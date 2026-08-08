'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import { formatVerdict, useSubmissionList } from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

export default function StudentSubmissionsPage() {
  const listQuery = useSubmissionList({ limit: 50 });
  const rows = listQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.LAB_READ} enforce>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Practice Labs</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">My submissions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            History of your practice lab submissions and verdicts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>Most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            {listQuery.isError ? (
              <ErrorState message="Unable to load submissions." />
            ) : listQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No submissions yet"
                description="Solve a problem and submit your solution."
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {rows.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <Link
                        href={`/student/practice-labs/${s.problemId}`}
                        className="font-medium hover:underline"
                      >
                        Problem {s.problemId.slice(-6)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {s.language} · attempt #{s.attemptNumber} ·{' '}
                        {new Date(s.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.verdict === 'accepted' ? 'default' : 'secondary'}>
                        {formatVerdict(s.verdict)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {s.score}/{s.maxScore}
                      </span>
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
