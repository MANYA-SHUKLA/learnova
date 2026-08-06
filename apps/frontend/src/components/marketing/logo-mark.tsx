import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft-sm',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.25">
        <path d="M4 19V7.5A2.5 2.5 0 0 1 6.5 5H12" strokeLinecap="round" />
        <path d="M20 19V7.5A2.5 2.5 0 0 0 17.5 5H12" strokeLinecap="round" />
        <path d="M12 5v14" strokeLinecap="round" />
        <path d="M8 19h8" strokeLinecap="round" />
      </svg>
    </span>
  );
}
