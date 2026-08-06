import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg bg-primary font-display text-[11px] font-bold tracking-tight text-primary-foreground shadow-soft-sm',
        className,
      )}
      aria-hidden
    >
      MS
    </span>
  );
}
