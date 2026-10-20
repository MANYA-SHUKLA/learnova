'use client';

import { Spinner } from '@learnova/ui';
import { cn } from '@/lib/utils';

interface DashboardRouteShellProps {
  message?: string;
  className?: string;
}

/** Full-page session gate for `(dashboard)/layout.tsx` (auth / redirects). */
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
