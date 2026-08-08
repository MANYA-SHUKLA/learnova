'use client';

import { Input, Spinner } from '@learnova/ui';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  id?: string;
  label?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  visibleRows?: number;
  className?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  serverSideSearch?: boolean;
}

const selectClassName =
  'w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function SearchableSelect({
  id,
  label,
  hint,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  emptyMessage = 'No matches found.',
  allowEmpty = false,
  emptyLabel = 'None',
  disabled = false,
  loading = false,
  visibleRows = 6,
  className,
  searchPlaceholder = 'Search...',
  searchQuery,
  onSearchQueryChange,
  serverSideSearch = false,
}: SearchableSelectProps) {
  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery ?? localQuery;
  const setQuery = onSearchQueryChange ?? setLocalQuery;

  const filtered = useMemo(() => {
    if (serverSideSearch) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, serverSideSearch]);

  const isDisabled = disabled || loading;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          disabled={isDisabled}
          className="rounded-lg pr-9"
          aria-controls={id}
        />
        {loading ? (
          <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
        ) : null}
      </div>

      <select
        id={id}
        size={visibleRows}
        className={selectClassName}
        value={value}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {!allowEmpty && !value ? (
          <option value="" disabled>
            {loading ? 'Loading...' : placeholder}
          </option>
        ) : null}
        {filtered.length === 0 ? (
          <option value="" disabled>
            {loading ? 'Loading...' : emptyMessage}
          </option>
        ) : (
          filtered.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

export type { SearchableMultiSelectProps } from './searchable-multi-select';
export { SearchableMultiSelect } from './searchable-multi-select';
