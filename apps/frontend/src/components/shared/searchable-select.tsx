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
  searchPlaceholder = 'Search…',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

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
            {loading ? 'Loading…' : placeholder}
          </option>
        ) : null}
        {filtered.length === 0 ? (
          <option value="" disabled>
            {loading ? 'Loading…' : emptyMessage}
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
}

export function SearchableMultiSelect({
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
  searchPlaceholder = 'Search…',
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

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
          <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
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
