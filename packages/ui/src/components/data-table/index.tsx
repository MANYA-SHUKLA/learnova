'use client';

import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../button';
import { Input } from '../input';
import { Skeleton } from '../skeleton';
import { EmptyState } from '../empty-state';

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Used for sorting when cell content is not plain text */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  /** Hide column in mobile card summary */
  hideOnMobile?: boolean;
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number, totalPages: number, total: number) => string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  filters?: React.ReactNode;
  bulkActions?: React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  pagination?: DataTablePagination;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  mobileRow?: (row: T) => React.ReactNode;
  caption?: string;
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return null;
  return dir === 'asc' ? (
    <ChevronUp className="size-3.5" aria-hidden />
  ) : (
    <ChevronDown className="size-3.5" aria-hidden />
  );
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  searchable,
  searchPlaceholder = 'Search…',
  searchFilter,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'When records appear, they will show up in this table.',
  emptyAction,
  toolbar,
  filters,
  bulkActions,
  className,
  onRowClick,
  rowActions,
  pagination,
  selectable,
  selectedIds = [],
  onSelectionChange,
  mobileRow,
  caption,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim() || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, query.trim().toLowerCase()));
  }, [data, query, searchFilter]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortable) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : String(col.cell(a) ?? '');
      const bv = col.sortValue ? col.sortValue(b) : String(col.cell(b) ?? '');
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av;
      }
      return sort.dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sort, columns]);

  const allSelected =
    selectable && sorted.length > 0 && sorted.every((row) => selectedIds.includes(rowKey(row)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(sorted.map((row) => rowKey(row)));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  };

  const showToolbar = searchable || toolbar || filters || (selectable && selectedIds.length > 0 && bulkActions);

  return (
    <div className={cn('space-y-4', className)}>
      {showToolbar ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {searchable ? (
              <div className="relative w-full lg:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 rounded-xl border-border/80 bg-muted/30 pl-9"
                  aria-label={searchPlaceholder}
                />
              </div>
            ) : (
              <div className="hidden lg:block" />
            )}
            {toolbar}
          </div>
          {filters}
          {selectable && selectedIds.length > 0 && bulkActions ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2">
              <span className="text-caption text-muted-foreground">
                {selectedIds.length} selected
              </span>
              {bulkActions}
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          {mobileRow ? (
            <ul className="space-y-3 md:hidden">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={`msk-${i}`}>
                      <Skeleton className="h-28 w-full rounded-xl" />
                    </li>
                  ))
                : sorted.map((row) => (
                    <li key={rowKey(row)}>{mobileRow(row)}</li>
                  ))}
            </ul>
          ) : null}

          <div
            className={cn(
              'overflow-hidden rounded-xl border border-border/80 bg-card shadow-soft-sm',
              mobileRow && 'hidden md:block',
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                {caption ? <caption className="sr-only">{caption}</caption> : null}
                <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                  <tr className="border-b border-border/80">
                    {selectable ? (
                      <th scope="col" className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Select all rows"
                          className="size-4 rounded border-border"
                        />
                      </th>
                    ) : null}
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        scope="col"
                        className={cn(
                          'px-4 py-3 text-label font-medium text-muted-foreground',
                          col.headerClassName,
                        )}
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                            onClick={() =>
                              setSort((prev) =>
                                prev?.id === col.id && prev.dir === 'asc'
                                  ? { id: col.id, dir: 'desc' }
                                  : { id: col.id, dir: 'asc' },
                              )
                            }
                          >
                            {col.header}
                            <SortIndicator active={sort?.id === col.id} dir={sort?.dir ?? 'asc'} />
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    ))}
                    {rowActions ? (
                      <th scope="col" className="px-4 py-3 text-right text-label font-medium text-muted-foreground">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`sk-${i}`} className="border-b border-border/60">
                          {selectable ? (
                            <td className="px-3 py-3">
                              <Skeleton className="size-4 rounded" />
                            </td>
                          ) : null}
                          {columns.map((col) => (
                            <td key={col.id} className="px-4 py-3">
                              <Skeleton className="h-5 w-full max-w-[12rem]" />
                            </td>
                          ))}
                          {rowActions ? (
                            <td className="px-4 py-3">
                              <Skeleton className="ml-auto h-8 w-20" />
                            </td>
                          ) : null}
                        </tr>
                      ))
                    : sorted.map((row) => {
                        const id = rowKey(row);
                        const selected = selectedIds.includes(id);
                        return (
                          <tr
                            key={id}
                            className={cn(
                              'border-b border-border/60 transition-colors last:border-0',
                              onRowClick && 'cursor-pointer hover:bg-muted/40',
                              selected && 'bg-primary/[0.03]',
                            )}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                          >
                            {selectable ? (
                              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleOne(id)}
                                  aria-label={`Select row ${id}`}
                                  className="size-4 rounded border-border"
                                />
                              </td>
                            ) : null}
                            {columns.map((col) => (
                              <td
                                key={col.id}
                                className={cn('px-4 py-3 align-middle', col.className)}
                              >
                                {col.cell(row)}
                              </td>
                            ))}
                            {rowActions ? (
                              <td
                                className="px-4 py-3 text-right align-middle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-wrap justify-end gap-1">{rowActions(row)}</div>
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {pagination && sorted.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            {pagination.pageLabel
              ? pagination.pageLabel(pagination.page, pagination.totalPages, pagination.total)
              : `Page ${pagination.page} of ${Math.max(pagination.totalPages, 1)} · ${pagination.total} total`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!pagination.hasPrevPage}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              {pagination.previousLabel ?? 'Previous'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!pagination.hasNextPage}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              {pagination.nextLabel ?? 'Next'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
