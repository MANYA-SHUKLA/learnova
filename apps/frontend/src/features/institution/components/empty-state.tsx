'use client';

import { Button, Card, CardContent } from '@learnova/ui';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-primary">
          <Inbox className="size-6" />
        </div>
        <div className="space-y-2">
          <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
          {description ? (
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="mt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-danger/20 bg-danger/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
        <p className="text-sm text-danger">{message}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
