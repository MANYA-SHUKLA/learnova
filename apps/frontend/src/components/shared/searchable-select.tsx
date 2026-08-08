'use client';

import { Input, Spinner } from '@learnova/ui';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery ?? localQuery;
  const setQuery = onSearchQueryChange ?? setLocalQuery;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (serverSideSearch) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, serverSideSearch]);

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

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
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

  const inputValue = open ? query : (selectedOption?.label ?? '');

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
          aria-autocomplete="list"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value);
            openDropdown();
          }}
          onFocus={openDropdown}
          placeholder={open ? searchPlaceholder : placeholder}
          disabled={isDisabled}
          className="rounded-lg pr-9"
        />
        {loading ? (
          <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
        ) : (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle options"
            disabled={isDisabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => (open ? closeDropdown() : openDropdown())}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
            />
          </button>
        )}

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-y-auto rounded-lg border border-input bg-background py-1 shadow-md"
            style={{ maxHeight: `${visibleRows * 2.25}rem` }}
          >
            {allowEmpty ? (
              <li
                role="option"
                aria-selected={value === ''}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm hover:bg-muted/40',
                  value === '' && 'bg-muted/60',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption('')}
              >
                {emptyLabel}
              </li>
            ) : null}
            {loading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Loading...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm hover:bg-muted/40',
                    option.value === value && 'bg-muted/60',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!option.disabled) selectOption(option.value);
                  }}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export type { SearchableMultiSelectProps } from './searchable-multi-select';
export { SearchableMultiSelect } from './searchable-multi-select';
