'use client';

import { Spinner } from '@learnova/ui';
import { cn } from '@/lib/utils';

interface DashboardRouteShellProps {
  message?: string;
  className?: string;
}

/**
 * Single loading shell for `(dashboard)/layout` and `(dashboard)/loading.tsx`.
 * Keep markup identical in both places to avoid Next.js Suspense vs layout hydration mismatches.
 */
export function DashboardRouteShell({
  message = 'Loading…',
  className,
}: DashboardRouteShellProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className={cn(
          'flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-background',
          className,
        )}
      >
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
