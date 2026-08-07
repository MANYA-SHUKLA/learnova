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
  formatVerdict,
  useProblemList,
  useStudentPracticeDashboard,
} from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

export default function StudentPracticeLabsPage() {
  const dashQuery = useStudentPracticeDashboard();
  const problemsQuery = useProblemList({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
  const dash = dashQuery.data;
  const problems = problemsQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.LAB_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Practice Labs</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Solve & practice</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Write code in the browser, run tests, submit, and track your streak.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={APP_ROUTES.STUDENT_SUBMISSIONS}>My submissions</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Streak', value: dash?.practiceStreak },
            { label: 'Solved', value: dash?.problemsSolved },
            { label: 'Accepted', value: dash?.accepted },
            { label: 'Pending', value: dash?.pending },
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

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Problems</CardTitle>
              <CardDescription>Published problems from your enrolled courses.</CardDescription>
            </CardHeader>
            <CardContent>
              {problemsQuery.isError ? (
                <ErrorState message="Unable to load problems." />
              ) : problemsQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : problems.length === 0 ? (
                <EmptyState
                  title="No problems yet"
                  description="Published practice problems will appear here."
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {problems.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <Link
                          href={`/student/practice-labs/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{formatDifficulty(p.difficulty)}</Badge>
                          <span>{p.tags.slice(0, 3).join(', ')}</span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/student/practice-labs/${p.id}`}>Solve</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {(dash?.recentActivity ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent submissions.</p>
              ) : (
                <ul className="space-y-3">
                  {dash?.recentActivity.map((item) => (
                    <li key={`${item.problemId}-${item.at}`} className="text-sm">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatVerdict(item.verdict)} · {new Date(item.at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
