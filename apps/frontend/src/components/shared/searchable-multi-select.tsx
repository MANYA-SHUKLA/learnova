'use client';

import { Input } from '@learnova/ui';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
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

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

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

  const closeDropdown = () => {
    setOpen(false);
    if (onSearchQueryChange) {
      onSearchQueryChange('');
    } else {
      setLocalQuery('');
    }
  };

  const openDropdown = () => {
    if (isDisabled) return;
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      <div ref={containerRef} className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            openDropdown();
          }}
          onFocus={openDropdown}
          placeholder={searchPlaceholder}
          disabled={isDisabled}
          className="rounded-lg pr-9"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options"
          disabled={isDisabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => (open ? closeDropdown() : openDropdown())}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-y-auto rounded-lg border border-input bg-background shadow-md"
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
                  onMouseDown={(e) => e.preventDefault()}
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
        ) : null}
      </div>

      {values.length > 0 ? (
        <p className="text-xs text-muted-foreground">{values.length} selected</p>
      ) : null}
    </div>
  );
}
