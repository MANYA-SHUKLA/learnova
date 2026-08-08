'use client';

import { Input } from '@learnova/ui';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SearchableSelectOption } from './searchable-select';

export interface SearchableMultiSelectProps {
  id?: string;
  label?: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchableSelectOption[];
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  visibleRows?: number;
  className?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  serverSideSearch?: boolean;
}

export function SearchableMultiSelect(props: SearchableMultiSelectProps) {
  const {
    id,
    label,
    hint,
    values,
    onChange,
    options,
    emptyMessage = 'No matches found.',
    disabled = false,
    loading = false,
    visibleRows = 8,
    className,
    searchPlaceholder = 'Search...',
    searchQuery,
    onSearchQueryChange,
    serverSideSearch = false,
  } = props;

  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery ?? localQuery;
  const setQuery = onSearchQueryChange ?? setLocalQuery;

  const filtered = useMemo(() => {
    if (serverSideSearch) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, serverSideSearch]);

  const toggle = (optionValue: string) => {
    onChange(
      values.includes(optionValue)
        ? values.filter((value) => value !== optionValue)
        : [...values, optionValue],
    );
  };

  const isDisabled = disabled || loading;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      <Input
        id={id}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        disabled={isDisabled}
        className="rounded-lg"
      />

      <div
        className={cn(
          'overflow-y-auto rounded-lg border border-input bg-background',
          isDisabled && 'cursor-not-allowed opacity-50',
        )}
        style={{ maxHeight: `${visibleRows * 2.25}rem` }}
      >
        {loading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          filtered.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 border-b border-border/40 px-3 py-2 text-sm last:border-b-0 hover:bg-muted/40"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={values.includes(option.value)}
                disabled={isDisabled || option.disabled}
                onChange={() => toggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))
        )}
      </div>

      {values.length > 0 ? (
        <p className="text-xs text-muted-foreground">{values.length} selected</p>
      ) : null}
    </div>
  );
}
