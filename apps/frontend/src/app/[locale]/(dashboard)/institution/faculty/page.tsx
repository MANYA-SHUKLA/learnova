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
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Download,
  Plus,
  Search,
  Upload,
  UserRound,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  EmptyState,
  ErrorState,
} from '@/features/institution';
import {
  formatDesignation,
  formatEmploymentType,
  formatFacultyStatus,
  useArchiveFacultyMutation,
  useBulkActivateFacultyMutation,
  useBulkArchiveFacultyMutation,
  useBulkSuspendFacultyMutation,
  useFacultyList,
  useFacultyStats,
  useRestoreFacultyMutation,
} from '@/features/faculty';
import type { FacultyStatus } from '@/features/faculty';
import { Link } from '@/lib/i18n/routing';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/auth/jwt';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<FacultyStatus | 'all'> = [
  'all',
  'active',
  'on_leave',
  'suspended',
  'retired',
  'archived',
];

export default function FacultyListPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FacultyStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === 'all' ? undefined : status,
      includeDeleted: includeDeleted || status === 'archived',
      page,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search, status, includeDeleted, page],
  );

  const listQuery = useFacultyList(params);
  const statsQuery = useFacultyStats();
  const archiveMutation = useArchiveFacultyMutation();
  const restoreMutation = useRestoreFacultyMutation();
  const bulkArchive = useBulkArchiveFacultyMutation();
  const bulkActivate = useBulkActivateFacultyMutation();
  const bulkSuspend = useBulkSuspendFacultyMutation();

  const rows = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;

  const toggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const downloadExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const token = getAccessToken();
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/faculty/export?format=${format}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faculty-export.${format === 'excel' ? 'xls' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permission={PERMISSIONS.FACULTY_READ} enforce>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">People</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Faculty
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage faculty records, employment status, and academic assignments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.INSTITUTION_FACULTY_IMPORT}>
                <Upload className="size-4" />
                Import
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={APP_ROUTES.INSTITUTION_FACULTY_EXPORT}>
                <Download className="size-4" />
                Export
              </Link>
            </Button>
            <PermissionGate permission={PERMISSIONS.FACULTY_MANAGE}>
              <Button asChild>
                <Link href={APP_ROUTES.INSTITUTION_FACULTY_CREATE}>
                  <Plus className="size-4" />
                  Add faculty
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {statsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border-border/80">
                  <CardContent className="p-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-3 h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : [
                { label: 'Total', value: stats?.total ?? 0 },
                { label: 'Active', value: stats?.active ?? 0 },
                { label: 'Inactive', value: stats?.inactive ?? 0 },
                { label: 'On Leave', value: stats?.onLeave ?? 0 },
                { label: 'Departments', value: stats?.departments ?? 0 },
                { label: 'New this month', value: stats?.newThisMonth ?? 0 },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="rounded-2xl border-border/80">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                        {card.value.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Directory</CardTitle>
            <CardDescription>Search, filter, and run bulk actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search name, employee ID, code, email…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(q.trim());
                      setPage(1);
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch(q.trim());
                  setPage(1);
                }}
              >
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatus(s);
                    setIncludeDeleted(s === 'archived');
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    status === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  {s === 'all' ? 'All' : formatFacultyStatus(s)}
                </button>
              ))}
            </div>

            {selected.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                <span className="text-sm text-muted-foreground">{selected.length} selected</span>
                <PermissionGate permission={PERMISSIONS.FACULTY_MANAGE}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkActivate.isPending}
                    onClick={() => void bulkActivate.mutateAsync(selected).then(() => setSelected([]))}
                  >
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkSuspend.isPending}
                    onClick={() => void bulkSuspend.mutateAsync(selected).then(() => setSelected([]))}
                  >
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={bulkArchive.isPending}
                    onClick={() => void bulkArchive.mutateAsync(selected).then(() => setSelected([]))}
                  >
                    Archive
                  </Button>
                </PermissionGate>
                <Button size="sm" variant="ghost" onClick={() => void downloadExport('csv')}>
                  Export CSV
                </Button>
              </div>
            ) : null}

            {listQuery.isError ? (
              <ErrorState
                message={
                  listQuery.error instanceof Error
                    ? listQuery.error.message
                    : 'Failed to load faculty.'
                }
                onRetry={() => void listQuery.refetch()}
              />
            ) : null}

            {listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                illustration="faculty"
                title="No faculty yet"
                description="Add your first faculty member or import a CSV to populate the directory."
                action={
                  <PermissionGate permission={PERMISSIONS.FACULTY_MANAGE}>
                    <Button asChild>
                      <Link href={APP_ROUTES.INSTITUTION_FACULTY_CREATE}>Add faculty</Link>
                    </Button>
                  </PermissionGate>
                }
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.length === rows.length && rows.length > 0}
                            onChange={toggleAll}
                            aria-label="Select all"
                          />
                        </th>
                        <th className="px-3 py-3">Faculty</th>
                        <th className="px-3 py-3">Employee ID</th>
                        <th className="px-3 py-3">Designation</th>
                        <th className="px-3 py-3">Employment</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-border/70 hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(row.id)}
                              onChange={() => toggleOne(row.id)}
                              aria-label={`Select ${row.fullName}`}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={`${APP_ROUTES.INSTITUTION_FACULTY}/${row.id}`}
                              className="flex items-center gap-3 font-medium hover:text-primary"
                            >
                              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {row.profilePhoto ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={row.profilePhoto}
                                    alt=""
                                    className="size-9 rounded-xl object-cover"
                                  />
                                ) : (
                                  <UserRound className="size-4" />
                                )}
                              </span>
                              <span>
                                <span className="block">{row.fullName}</span>
                                <span className="block text-xs font-normal text-muted-foreground">
                                  {row.email}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3 tabular-nums">{row.employeeId}</td>
                          <td className="px-3 py-3">
                            {formatDesignation(row.designation, row.customDesignation)}
                          </td>
                          <td className="px-3 py-3">{formatEmploymentType(row.employmentType)}</td>
                          <td className="px-3 py-3">
                            <Badge variant="secondary">{formatFacultyStatus(row.status)}</Badge>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="inline-flex gap-1">
                              <Button asChild size="sm" variant="ghost">
                                <Link href={`${APP_ROUTES.INSTITUTION_FACULTY}/${row.id}`}>
                                  View
                                </Link>
                              </Button>
                              <PermissionGate permission={PERMISSIONS.FACULTY_MANAGE}>
                                {row.deletedAt ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={restoreMutation.isPending}
                                    onClick={() => void restoreMutation.mutateAsync(row.id)}
                                  >
                                    Restore
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={archiveMutation.isPending}
                                    onClick={() => void archiveMutation.mutateAsync(row.id)}
                                  >
                                    Archive
                                  </Button>
                                )}
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {rows.map((row) => (
                    <Card key={row.id} className="rounded-2xl">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{row.fullName}</p>
                            <p className="text-xs text-muted-foreground">{row.email}</p>
                          </div>
                          <Badge variant="secondary">{formatFacultyStatus(row.status)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {row.employeeId} · {formatDesignation(row.designation, row.customDesignation)}
                        </p>
                        <Button asChild size="sm" variant="outline" className="w-full">
                          <Link href={`${APP_ROUTES.INSTITUTION_FACULTY}/${row.id}`}>
                            Open profile
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {meta ? (
                  <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>
                      Page {meta.page} of {meta.totalPages} · {meta.total} total
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!meta.hasPrevPage}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!meta.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {stats && (stats.byDepartment.length > 0 || stats.byEmploymentType.length > 0) ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
                  Department distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.byDepartment.map((d) => (
                  <div
                    key={d.departmentId ?? 'none'}
                    className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm"
                  >
                    <span>{d.label}</span>
                    <span className="tabular-nums font-medium">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Employment types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.byEmploymentType.map((d) => (
                  <div
                    key={d.employmentType}
                    className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm"
                  >
                    <span>
                      {formatEmploymentType(
                        d.employmentType as Parameters<typeof formatEmploymentType>[0],
                      )}
                    </span>
                    <span className="tabular-nums font-medium">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </PermissionGate>
  );
}
