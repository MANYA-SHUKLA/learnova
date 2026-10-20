'use client';

import { Spinner } from '@learnova/ui';
import { cn } from '@/lib/utils';

interface DashboardRouteShellProps {
  message?: string;
  className?: string;
}

/**
 * Single loading shell for `(dashboard)/layout` and `(dashboard)/loading.tsx`.
 * Keep markup identical in `(dashboard)/layout.tsx` and `(dashboard)/loading.tsx`.
 */
export function DashboardRouteShell({
  message = 'Loading…',
  className,
}: DashboardRouteShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background',
        className,
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
