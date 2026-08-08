'use client';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@learnova/ui';
import { Activity } from 'lucide-react';
import type { LearningActivity } from '../types';
import { formatActivityType } from '../lib/labels';

interface ActivityTimelineProps {
  items: LearningActivity[];
  loading?: boolean;
  title?: string;
  description?: string;
  emptyLabel?: string;
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ActivityTimeline({
  items,
  loading = false,
  title = 'Recent activity',
  description = 'Your latest learning events.',
  emptyLabel = 'No activity yet.',
}: ActivityTimelineProps) {
  return (
    <Card className="rounded-2xl border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="relative space-y-0 border-l border-border/70 pl-4">
            {items.map((item) => (
              <li key={item.id} className="relative pb-4 last:pb-0">
                <span className="absolute -left-[1.3rem] top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background">
                  <Activity className="size-3 text-primary" />
                </span>
                <div className="rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{formatActivityType(item.type)}</p>
                    {item.durationSeconds > 0 ? (
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round(item.durationSeconds / 60)}m
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatWhen(item.occurredAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
