'use client';

import { Spinner } from '@learnova/ui';
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
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
