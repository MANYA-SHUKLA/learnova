'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  href?: string;
  className?: string;
}

export function Logo({ collapsed = false, href = APP_ROUTES.DASHBOARD, className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label="Learnova"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-soft-sm">
        <svg
          viewBox="0 0 24 24"
          className="size-5 text-primary-foreground"
          aria-hidden
          fill="none"
        >
          <path
            d="M7 5.5h4.2c3.35 0 5.55 1.85 5.55 4.7 0 2.95-2.2 4.8-5.55 4.8H9.4V18.5H7V5.5Zm2.4 2.15v5.2h1.7c1.95 0 3.15-1.05 3.15-2.6s-1.2-2.6-3.15-2.6H9.4Z"
            fill="currentColor"
          />
        </svg>
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
