'use client';

import { Card, CardContent, Skeleton } from '@learnova/ui';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStatItem {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
}

interface ProgressStatCardsProps {
  items: ProgressStatItem[];
  loading?: boolean;
  className?: string;
}

export function ProgressStatCards({ items, loading = false, className }: ProgressStatCardsProps) {
  if (loading) {
    return (
      <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.id} className="rounded-2xl border-border/80">
            <CardContent className="flex items-start gap-3 p-4">
              {Icon ? (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  {item.value}
                </p>
                {item.hint ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
