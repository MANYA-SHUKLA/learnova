'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  href?: string;
  className?: string;
}

export function Logo({ collapsed = false, href = APP_ROUTES.INSTITUTION_DASHBOARD, className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label="Learnova"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary font-display text-xs font-bold tracking-tight text-primary-foreground shadow-soft-sm">
        MS
      </span>
      <span
        className={cn(
          'font-display text-lg font-semibold tracking-tight text-foreground transition-all duration-200',
          collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100',
        )}
      >
        Learnova
      </span>
    </Link>
  );
}
