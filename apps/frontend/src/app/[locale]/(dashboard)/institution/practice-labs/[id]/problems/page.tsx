'use client';

import { PERMISSIONS } from '@learnova/constants';
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
import { use, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDifficulty,
  useCreateProblemMutation,
  usePracticeLab,
  useProblemList,
} from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

export default function InstitutionLabProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const labQuery = usePracticeLab(id);
  const problemsQuery = useProblemList({ practiceLabId: id, limit: 100 });
  const createProblem = useCreateProblemMutation();

  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [sampleIn, setSampleIn] = useState('');
  const [sampleOut, setSampleOut] = useState('');

  const lab = labQuery.data;
  const problems = problemsQuery.data?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.LAB_WRITE} enforce>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/institution/practice-labs/${id}`}>← Back to lab</Link>
        </Button>

        <div>
          <p className="text-sm font-medium text-primary">Problem bank</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            {lab?.title ?? 'Practice lab'} problems
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add problem</CardTitle>
            <CardDescription>Create a coding problem with sample I/O.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Problem statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Sample input"
                value={sampleIn}
                onChange={(e) => setSampleIn(e.target.value)}
              />
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Sample output"
                value={sampleOut}
                onChange={(e) => setSampleOut(e.target.value)}
              />
            </div>
            <Button
              disabled={!title || !statement || createProblem.isPending}
              onClick={() =>
                createProblem.mutate(
                  {
                    practiceLabId: id,
                    title,
                    problemStatement: statement,
                    sampleInput: sampleIn || null,
                    sampleOutput: sampleOut || null,
                    difficulty: 'easy',
                    tags: ['practice'],
                  },
                  {
                    onSuccess: () => {
                      setTitle('');
                      setStatement('');
                      setSampleIn('');
                      setSampleOut('');
                    },
                  },
                )
              }
            >
              Add problem
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Problems</CardTitle>
          </CardHeader>
          <CardContent>
            {problemsQuery.isError ? (
              <ErrorState message="Unable to load problems." />
            ) : problemsQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : problems.length === 0 ? (
              <EmptyState title="No problems" description="Add your first coding problem." />
            ) : (
              <ul className="divide-y divide-border/60">
                {problems.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {p.problemStatement}
                        </p>
                      </div>
                      <Badge variant="outline">{formatDifficulty(p.difficulty)}</Badge>
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
