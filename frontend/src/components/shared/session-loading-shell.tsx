'use client';

import { cn } from '@/lib/utils';

interface SessionLoadingShellProps {
  message?: string;
  className?: string;
}

/** Auth/route gate loading UI — client-only so SSR and hydration markup stay identical. */
export function SessionLoadingShell({
  message = 'Loading…',
  className = 'min-h-[50vh]',
}: SessionLoadingShellProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-3 bg-background',
        className,
      )}
    >
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent"
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
