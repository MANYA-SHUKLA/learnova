'use client';

import { Badge, DataTable, type DataTableColumn, type DataTablePagination } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { OrgEntityStatus } from '../types';

export type { DataTableColumn, DataTablePagination };

export interface ResourceColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number | boolean | null | undefined;
}

interface ResourceTableProps<T extends { id: string }> {
  columns: ResourceColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  rowActions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pagination?: DataTablePagination;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: ReactNode;
  filters?: ReactNode;
  toolbar?: ReactNode;
  caption?: string;
  onRowClick?: (row: T) => void;
  mobileRow?: (row: T) => ReactNode;
}

export function StatusBadge({ status }: { status: OrgEntityStatus }) {
  const variant =
    status === 'active' ? 'success' : status === 'inactive' ? 'warning' : 'secondary';

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function ResourceTable<T extends { id: string }>({
  columns,
  rows,
  isLoading,
  rowActions,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting filters or add a new record.',
  emptyAction,
  pagination,
  selectable,
  selectedIds,
  onSelectionChange,
  bulkActions,
  filters,
  toolbar,
  caption,
  onRowClick,
  mobileRow,
}: ResourceTableProps<T>) {
  const tableColumns: DataTableColumn<T>[] = columns.map((col) => ({
    id: col.id,
    header: col.header,
    cell: col.cell,
    className: col.className,
    sortable: col.sortable,
    sortValue: col.sortValue,
  }));

  return (
    <DataTable
      columns={tableColumns}
      data={rows}
      rowKey={(row) => row.id}
      loading={isLoading}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      rowActions={rowActions}
      pagination={pagination}
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      bulkActions={bulkActions}
      filters={filters}
      toolbar={toolbar}
      caption={caption}
      onRowClick={onRowClick}
      mobileRow={mobileRow}
    />
  );
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  total: number;
  onPageChange: (page: number) => void;
}

/** @deprecated Pass `pagination` to ResourceTable instead */
export function PaginationControls({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  total,
  onPageChange,
}: PaginationControlsProps) {
  const t = useTranslations('dashboard.institution.crud');
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <p className="text-xs text-muted-foreground">
        {t('pageOf', { page, totalPages: Math.max(totalPages, 1), total })}
      </p>
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-1.5 text-sm disabled:opacity-50 sm:flex-none"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          {t('previous')}
        </button>
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-1.5 text-sm disabled:opacity-50 sm:flex-none"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}

export function buildPagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  total,
  onPageChange,
}: PaginationControlsProps): DataTablePagination {
  return { page, totalPages, hasNextPage, hasPrevPage, total, onPageChange };
}
