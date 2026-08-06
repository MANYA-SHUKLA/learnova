'use client';

import { Badge, Button, Skeleton } from '@learnova/ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { OrgEntityStatus } from '../types';

export interface ResourceColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Value used for CSV export; defaults to stringified cell text when omitted */
  exportValue?: (row: T) => string | number | boolean | null | undefined;
}

interface ResourceTableProps<T extends { id: string }> {
  columns: ResourceColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  rowActions?: (row: T) => ReactNode;
  emptyMessage?: string;
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
  emptyMessage = 'No records found.',
}: ResourceTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl border border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* Mobile: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-soft-sm"
          >
            <dl className="space-y-3">
              {columns.map((col) => (
                <div key={col.id} className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">{col.header}</dt>
                  <dd className={cn('mt-0.5 break-words text-sm text-foreground', col.className)}>
                    {col.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
            {rowActions ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 print:hidden">
                {rowActions(row)}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {/* Desktop / tablet: scrollable table */}
      <div className="hidden min-w-0 overflow-x-auto rounded-2xl border border-border shadow-soft-sm md:block">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 backdrop-blur-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'whitespace-nowrap px-3 py-3 font-medium text-muted-foreground sm:px-4',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {rowActions ? (
                <th className="px-3 py-3 text-right font-medium text-muted-foreground print:hidden sm:px-4">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn('max-w-[16rem] truncate px-3 py-3 align-middle sm:px-4', col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="px-3 py-3 text-right align-middle print:hidden sm:px-4">
                    <div className="flex flex-wrap justify-end gap-1">{rowActions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

export function PaginationControls({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  total,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <p className="text-xs text-muted-foreground">
        Page {page} of {Math.max(totalPages, 1)} · {total} total
      </p>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={!hasPrevPage}
          onClick={() => { onPageChange(page - 1); }}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={!hasNextPage}
          onClick={() => { onPageChange(page + 1); }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
