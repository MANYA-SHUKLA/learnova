'use client';

import { Input, Spinner } from '@learnova/ui';
import { Check, ChevronDown } from 'lucide-react';
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

const triggerClassName =
  'flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-all duration-200 ease-out hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const panelClassName =
  'absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-lg ring-1 ring-black/5';

const optionClassName =
  'group flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-all duration-150 ease-out hover:bg-primary/10 hover:pl-4';

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
  const [panelVisible, setPanelVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery ?? localQuery;
  const setQuery = onSearchQueryChange ?? setLocalQuery;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const displayLabel = useMemo(() => {
    if (selectedOption) return selectedOption.label;
    if (allowEmpty && value === '') return emptyLabel;
    return null;
  }, [allowEmpty, emptyLabel, selectedOption, value]);

  const filtered = useMemo(() => {
    if (serverSideSearch) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, serverSideSearch]);

  const isDisabled = disabled || loading;

  const clearSearch = () => {
    if (onSearchQueryChange) {
      onSearchQueryChange('');
    } else {
      setLocalQuery('');
    }
  };

  const closeDropdown = () => {
    setPanelVisible(false);
    window.setTimeout(() => {
      setOpen(false);
      clearSearch();
    }, 150);
  };

  const openDropdown = () => {
    if (isDisabled || open) return;
    setOpen(true);
    window.requestAnimationFrame(() => setPanelVisible(true));
  };

  const toggleDropdown = () => {
    if (isDisabled) return;
    if (open) closeDropdown();
    else openDropdown();
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
  };

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);

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
      window.clearTimeout(focusTimer);
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
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          disabled={isDisabled}
          className={cn(triggerClassName, open && 'border-primary/50 bg-muted/20 ring-2 ring-primary/15')}
          onClick={toggleDropdown}
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              displayLabel ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {loading && !displayLabel ? 'Loading…' : (displayLabel ?? placeholder)}
          </span>
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
                open && 'rotate-180 text-primary',
              )}
            />
          )}
        </button>

        {open ? (
          <div
            className={cn(
              panelClassName,
              'origin-top transition-all duration-200 ease-out',
              panelVisible ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0',
            )}
          >
            <div className="border-b border-border/60 bg-muted/20 p-2">
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className="h-9 rounded-lg border-border/70 bg-background"
                aria-label={searchPlaceholder}
              />
            </div>

            <ul
              id={listboxId}
              role="listbox"
              className="overflow-y-auto py-1"
              style={{ maxHeight: `${visibleRows * 2.5}rem` }}
            >
              {allowEmpty ? (
                <li
                  role="option"
                  aria-selected={value === ''}
                  className={cn(
                    optionClassName,
                    value === '' && 'bg-primary/10 pl-4 font-medium text-primary',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption('')}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0 transition-opacity duration-150',
                      value === '' ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{emptyLabel}</span>
                </li>
              ) : null}
              {loading ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">Loading options…</li>
              ) : filtered.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</li>
              ) : (
                filtered.map((option) => {
                  const selected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={option.disabled}
                      className={cn(
                        optionClassName,
                        selected && 'bg-primary/10 pl-4 font-medium text-primary',
                        option.disabled && 'cursor-not-allowed opacity-50 hover:pl-3 hover:bg-transparent',
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (!option.disabled) selectOption(option.value);
                      }}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0 transition-opacity duration-150',
                          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-30',
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type { SearchableMultiSelectProps } from './searchable-multi-select';
export { SearchableMultiSelect } from './searchable-multi-select';
