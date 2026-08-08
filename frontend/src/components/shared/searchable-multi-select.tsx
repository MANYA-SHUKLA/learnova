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

const triggerClassName =
  'flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-all duration-200 ease-out hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const panelClassName =
  'absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-lg ring-1 ring-black/5';

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
  const [panelVisible, setPanelVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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

  const triggerLabel = useMemo(() => {
    if (values.length === 0) return null;
    if (values.length === 1) {
      return options.find((option) => option.value === values[0])?.label ?? `${values.length} selected`;
    }
    return `${values.length} selected`;
  }, [options, values]);

  const toggle = (optionValue: string) => {
    onChange(
      values.includes(optionValue)
        ? values.filter((value) => value !== optionValue)
        : [...values, optionValue],
    );
  };

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
              triggerLabel ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {loading && !triggerLabel ? 'Loading…' : (triggerLabel ?? searchPlaceholder)}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
              open && 'rotate-180 text-primary',
            )}
          />
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

            <div
              id={listboxId}
              role="listbox"
              aria-multiselectable
              className="overflow-y-auto py-1"
              style={{ maxHeight: `${visibleRows * 2.5}rem` }}
            >
              {loading ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">Loading options…</p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
              ) : (
                filtered.map((option) => {
                  const checked = values.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'group flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm transition-all duration-150 ease-out hover:bg-primary/10 hover:pl-4',
                        checked && 'bg-primary/10 pl-4',
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-input accent-primary transition-transform duration-150 group-hover:scale-110"
                        checked={checked}
                        disabled={isDisabled || option.disabled}
                        onChange={() => toggle(option.value)}
                      />
                      <span className={cn('truncate', checked && 'font-medium text-primary')}>
                        {option.label}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>

      {values.length > 0 ? (
        <p className="text-xs text-muted-foreground">{values.length} selected</p>
      ) : null}
    </div>
  );
}
