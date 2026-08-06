'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, Input } from '@learnova/ui';
import { Plus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import type { OrgEntityStatus, OrgListParams, OrgListResult } from '../types';
import { EmptyState, ErrorState } from './empty-state';
import { ExportMenu } from './export-menu';
import { PageHeader } from './page-header';
import {
  ResourceFormDialog,
  type FormField,
} from './resource-form-dialog';
import {
  PaginationControls,
  ResourceTable,
  StatusBadge,
  type ResourceColumn,
} from './resource-table';

const STATUS_OPTIONS: { value: '' | OrgEntityStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

interface SoftRow { id: string; status: OrgEntityStatus; deletedAt: string | null }

interface ResourceCrudPageProps<T extends SoftRow> {
  title: string;
  description: string;
  exportFilename: string;
  columns: ResourceColumn<T>[];
  fields: FormField[];
  listQuery: (
    params: OrgListParams,
    enabled?: boolean,
  ) => {
    data?: OrgListResult<T>;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
  };
  // Hook factories from TanStack mutations — body shapes vary per resource
  createMutation: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutateAsync: (body: any) => Promise<unknown>;
    isPending: boolean;
  };
  updateMutation: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutateAsync: (vars: { id: string; body: any }) => Promise<unknown>;
    isPending: boolean;
  };
  archiveMutation: () => {
    mutateAsync: (id: string) => Promise<unknown>;
    isPending: boolean;
  };
  restoreMutation: () => {
    mutateAsync: (id: string) => Promise<unknown>;
    isPending: boolean;
  };
  mapValuesToBody?: (
    values: Record<string, string | number | boolean | null>,
  ) => Record<string, unknown>;
  getEditValues?: (row: T) => Record<string, string | number | boolean | null | undefined>;
  extraFilters?: ReactNode;
  extraListParams?: Partial<OrgListParams>;
}

function defaultMapValues(
  values: Record<string, string | number | boolean | null>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === '') {
      body[key] = null;
    } else {
      body[key] = value;
    }
  }
  return body;
}

export function ResourceCrudPage<T extends SoftRow>({
  title,
  description,
  exportFilename,
  columns,
  fields,
  listQuery,
  createMutation,
  updateMutation,
  archiveMutation,
  restoreMutation,
  mapValuesToBody = defaultMapValues,
  getEditValues,
  extraFilters,
  extraListParams,
}: ResourceCrudPageProps<T>) {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | OrgEntityStatus>('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const params: OrgListParams = {
    q: search || undefined,
    status: status || undefined,
    includeDeleted,
    page,
    limit: 20,
    ...extraListParams,
  };

  const { data, isLoading, isError, error, refetch } = listQuery(params);
  const create = createMutation();
  const update = updateMutation();
  const archive = archiveMutation();
  const restore = restoreMutation();

  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const meta = data?.meta;

  const exportHeaders = useMemo(() => columns.map((c) => c.header), [columns]);
  const exportRows = useMemo(
    () =>
      rows.map((row) =>
        columns.map((col) =>
          col.exportValue
            ? col.exportValue(row)
            : (() => {
                const cell = col.cell(row);
                return typeof cell === 'string' || typeof cell === 'number' ? cell : '';
              })(),
        ),
      ),
    [rows, columns],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (
    values: Record<string, string | number | boolean | null>,
  ) => {
    setFormError(null);
    try {
      const body = mapValuesToBody(values);
      if (editing) {
        await update.mutateAsync({ id: editing.id, body });
      } else {
        await create.mutateAsync(body);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    }
  };

  const applySearch = () => {
    setPage(1);
    setSearch(q.trim());
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <ExportMenu
              filename={exportFilename}
              headers={exportHeaders}
              rows={exportRows}
              disabled={isLoading}
            />
            <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="size-3.5" />
                Create
              </Button>
            </PermissionGate>
          </>
        }
      />

      <Card className="mb-6 print:hidden">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <Input
              value={q}
              placeholder="Search by name or code…"
              onChange={(e) => { setQ(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | OrgEntityStatus);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setPage(1);
              }}
              className="size-4 rounded border-input"
            />
            Include archived
          </label>
          {extraFilters}
          <Button type="button" variant="secondary" onClick={applySearch}>
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <div className="mb-4">
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load data.'}
            onRetry={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !isError && rows.length === 0 ? (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          description="Create a record or adjust filters to see results."
          action={
            <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
              <Button type="button" onClick={openCreate}>
                Create first record
              </Button>
            </PermissionGate>
          }
        />
      ) : (
        <>
          <ResourceTable
            columns={[
              ...columns,
              {
                id: 'status',
                header: 'Status',
                cell: (row) => <StatusBadge status={row.status} />,
                exportValue: (row) => row.status,
              },
            ]}
            rows={rows}
            isLoading={isLoading}
            rowActions={(row) => (
              <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { openEdit(row); }}>
                    Edit
                  </Button>
                  {row.deletedAt || row.status === 'archived' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={restore.isPending}
                      onClick={() => void restore.mutateAsync(row.id)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={archive.isPending}
                      onClick={() => void archive.mutateAsync(row.id)}
                    >
                      Archive
                    </Button>
                  )}
                </>
              </PermissionGate>
            )}
          />
          {meta ? (
            <PaginationControls
              page={meta.page}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPrevPage={meta.hasPrevPage}
              total={meta.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ResourceFormDialog
        open={dialogOpen}
        title={editing ? `Edit ${title.slice(0, -1) || title}` : `Create ${title.slice(0, -1) || title}`}
        fields={fields}
        initialValues={editing ? getEditValues?.(editing) : undefined}
        isSubmitting={create.isPending || update.isPending}
        error={formError}
        onClose={() => { setDialogOpen(false); }}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Update' : 'Create'}
      />
    </main>
  );
}
