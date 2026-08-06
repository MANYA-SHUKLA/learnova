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
      <div className="space-y-2 rounded-lg border border-border">
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
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  'px-4 py-3 font-medium text-muted-foreground',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
            {rowActions ? (
              <th className="px-4 py-3 text-right font-medium text-muted-foreground print:hidden">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col.id} className={cn('px-4 py-3 align-middle', col.className)}>
                  {col.cell(row)}
                </td>
              ))}
              {rowActions ? (
                <td className="px-4 py-3 text-right align-middle print:hidden">
                  <div className="flex flex-wrap justify-end gap-1">{rowActions(row)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
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
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => { onPageChange(page - 1); }}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => { onPageChange(page + 1); }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
