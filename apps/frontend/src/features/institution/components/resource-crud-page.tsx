'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, Input } from '@learnova/ui';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

interface SoftRow { id: string; status: OrgEntityStatus; deletedAt: string | null }

interface ResourceCrudPageProps<T extends SoftRow> {
  title: string;
  description: string;
  singularLabel?: string;
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
  singularLabel,
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
  const t = useTranslations('dashboard.institution.crud');
  const tStatus = useTranslations('dashboard.institution.status');
  const tCommon = useTranslations('common');
  const itemLabel = singularLabel ?? title;

  const statusOptions: { value: '' | OrgEntityStatus; label: string }[] = [
    { value: '', label: t('allStatuses') },
    { value: 'active', label: tStatus('active') },
    { value: 'inactive', label: tStatus('inactive') },
    { value: 'archived', label: tStatus('archived') },
  ];

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
      setFormError(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const applySearch = () => {
    setPage(1);
    setSearch(q.trim());
  };

  return (
    <div className="w-full min-w-0 space-y-6">
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
                {tCommon('create')}
              </Button>
            </PermissionGate>
          </>
        }
      />

      <Card className="print:hidden">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
          <div className="min-w-0 space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">{t('search')}</label>
            <Input
              value={q}
              placeholder={t('searchPlaceholder')}
              className="w-full min-w-0"
              onChange={(e) => { setQ(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('status')}</label>
            <select
              className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | OrgEntityStatus);
                setPage(1);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground lg:pb-2">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setPage(1);
              }}
              className="size-4 shrink-0 rounded border-input"
            />
            {t('includeArchived')}
          </label>
          {extraFilters ? (
            <div className="min-w-0 sm:col-span-2 lg:col-span-full">{extraFilters}</div>
          ) : null}
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={applySearch}>
            {t('apply')}
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <div className="mb-4">
          <ErrorState
            message={error instanceof Error ? error.message : t('loadFailed')}
            onRetry={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !isError && rows.length === 0 ? (
        <EmptyState
          title={t('emptyTitle', { resource: title.toLowerCase() })}
          description={t('emptyDescription')}
          action={
            <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
              <Button type="button" onClick={openCreate}>
                {t('createFirst')}
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
                header: t('status'),
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
                    {tCommon('edit')}
                  </Button>
                  {row.deletedAt || row.status === 'archived' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={restore.isPending}
                      onClick={() => void restore.mutateAsync(row.id)}
                    >
                      {t('restore')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={archive.isPending}
                      onClick={() => void archive.mutateAsync(row.id)}
                    >
                      {t('archive')}
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
        title={
          editing
            ? t('editTitle', { resource: itemLabel })
            : t('createTitle', { resource: itemLabel })
        }
        fields={fields}
        initialValues={editing ? getEditValues?.(editing) : undefined}
        isSubmitting={create.isPending || update.isPending}
        error={formError}
        onClose={() => { setDialogOpen(false); }}
        onSubmit={handleSubmit}
        submitLabel={editing ? t('update') : tCommon('create')}
      />
    </div>
  );
}
