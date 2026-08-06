import * as React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[skeleton-shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent dark:after:via-white/10',
        className,
      )}
      {...props}
    />
  );
}
