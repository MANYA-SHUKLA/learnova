'use client';

import { Button, Input } from '@learnova/ui';
import { Bookmark, Clock3, Search, X } from 'lucide-react';
import type { LearningStatus } from '../types';
import { LEARNING_STATUS_LABELS } from '../lib/labels';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: Array<LearningStatus | 'all'> = [
  'all',
  'not_started',
  'in_progress',
  'completed',
  'paused',
];

export interface ProgressFiltersProps {
  search: string;
  status: LearningStatus | 'all';
  recent?: boolean;
  bookmarked?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: LearningStatus | 'all') => void;
  onRecentChange?: (value: boolean) => void;
  onBookmarkedChange?: (value: boolean) => void;
  onSubmitSearch?: () => void;
  onClear?: () => void;
  searchPlaceholder?: string;
  showRecent?: boolean;
  showBookmarked?: boolean;
  className?: string;
}

export function ProgressFilters({
  search,
  status,
  recent = false,
  bookmarked = false,
  onSearchChange,
  onStatusChange,
  onRecentChange,
  onBookmarkedChange,
  onSubmitSearch,
  onClear,
  searchPlaceholder = 'Search courses…',
  showRecent = true,
  showBookmarked = true,
  className,
}: ProgressFiltersProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmitSearch?.();
            }}
          />
        </div>
        {onClear ? (
          <Button type="button" variant="outline" onClick={onClear} className="shrink-0">
            <X className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const label = option === 'all' ? 'All' : LEARNING_STATUS_LABELS[option];
          const active = status === option;
          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => onStatusChange(option)}
            >
              {label}
            </Button>
          );
        })}
        {showRecent && onRecentChange ? (
          <Button
            type="button"
            size="sm"
            variant={recent ? 'default' : 'outline'}
            onClick={() => onRecentChange(!recent)}
          >
            <Clock3 className="size-3.5" />
            Recent
          </Button>
        ) : null}
        {showBookmarked && onBookmarkedChange ? (
          <Button
            type="button"
            size="sm"
            variant={bookmarked ? 'default' : 'outline'}
            onClick={() => onBookmarkedChange(!bookmarked)}
          >
            <Bookmark className="size-3.5" />
            Bookmarked
          </Button>
        ) : null}
      </div>
    </div>
  );
}
