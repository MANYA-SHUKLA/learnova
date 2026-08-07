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
import { Code2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatDifficulty,
  formatLabStatus,
  useArchivePracticeLabMutation,
  useInstitutionPracticeDashboard,
  usePracticeLabList,
  usePublishPracticeLabMutation,
  type PracticeLabStatus,
} from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

const STATUS_FILTERS: Array<PracticeLabStatus | 'all'> = [
  'all',
  'draft',
  'published',
  'closed',
  'archived',
];

export default function InstitutionPracticeLabsPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PracticeLabStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: 20,
    }),
    [search, status, page],
  );

  const listQuery = usePracticeLabList(params);
  const dashQuery = useInstitutionPracticeDashboard();
  const publishMutation = usePublishPracticeLabMutation();
  const archiveMutation = useArchivePracticeLabMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const dash = dashQuery.data;

  return (
    <PermissionGate permission={PERMISSIONS.LAB_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Practice Labs</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Enterprise coding labs
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Labs, problems, executions, and accepted rates across the institution.
            </p>
          </div>
          <Button asChild>
            <Link href={APP_ROUTES.INSTITUTION_PRACTICE_LABS_CREATE}>Create lab</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total labs', value: dash?.totalLabs },
            { label: 'Problems', value: dash?.totalProblems },
            { label: 'Executions today', value: dash?.executionsToday },
            { label: 'Accepted rate', value: dash ? `${dash.acceptedRate}%` : undefined },
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Practice lab directory
            </CardTitle>
            <CardDescription>Search, publish, and archive coding practice labs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(q);
                      setPage(1);
                    }
                  }}
                  placeholder="Search labs…"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch(q);
                  setPage(1);
                }}
              >
                Search
              </Button>
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? 'default' : 'outline'}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                >
                  {s === 'all' ? 'All' : formatLabStatus(s)}
                </Button>
              ))}
            </div>

            {listQuery.isError ? (
              <ErrorState title="Unable to load practice labs." />
            ) : listQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="No practice labs yet"
                description="Create a lab and add problems for students to practice."
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {rows.map((lab) => (
                  <li key={lab.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <Link
                        href={`/institution/practice-labs/${lab.id}`}
                        className="font-medium hover:underline"
                      >
                        {lab.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{formatLabStatus(lab.status)}</Badge>
                        <Badge variant="outline">{formatDifficulty(lab.difficulty)}</Badge>
                        <span>{lab.problemCount} problems</span>
                        <span>{lab.languages.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {lab.status === 'draft' ? (
                        <Button
                          size="sm"
                          onClick={() => publishMutation.mutate(lab.id)}
                          disabled={publishMutation.isPending}
                        >
                          Publish
                        </Button>
                      ) : null}
                      {lab.status !== 'archived' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => archiveMutation.mutate(lab.id)}
                          disabled={archiveMutation.isPending}
                        >
                          Archive
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/institution/practice-labs/${lab.id}/problems`}>Problems</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.totalPages > 1 ? (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
