'use client';

import { Search } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input } from '../input';
import { Skeleton } from '../skeleton';
import { EmptyState } from '../empty-state';

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
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
  className?: string;
  onRowClick?: (row: T) => void;
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
  className,
  onRowClick,
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
      const av = String(col.cell(a) ?? '');
      const bv = String(col.cell(b) ?? '');
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sort, columns]);

  return (
    <div className={cn('space-y-4', className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
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
            <div />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-soft-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
              <tr className="border-b border-border/80">
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
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() =>
                          setSort((prev) =>
                            prev?.id === col.id && prev.dir === 'asc'
                              ? { id: col.id, dir: 'desc' }
                              : { id: col.id, dir: 'asc' },
                          )
                        }
                      >
                        {col.header}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-border/60">
                      {columns.map((col) => (
                        <td key={col.id} className="px-4 py-3">
                          <Skeleton className="h-5 w-full max-w-[12rem]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.map((row) => (
                    <tr
                      key={rowKey(row)}
                      className={cn(
                        'border-b border-border/60 transition-colors last:border-0',
                        onRowClick && 'cursor-pointer hover:bg-muted/40',
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((col) => (
                        <td key={col.id} className={cn('px-4 py-3 align-middle', col.className)}>
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : null}
    </div>
  );
}
