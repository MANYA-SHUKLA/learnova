'use client';

import type { InstitutionBranding } from '@learnova/types';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import { InstitutionMark } from '@/components/institution/institution-mark';

interface LogoProps {
  collapsed?: boolean;
  href: string;
  branding: InstitutionBranding | null | undefined;
  className?: string;
}

export function Logo({ collapsed = false, href, branding, className }: LogoProps) {
  const label = branding?.name ?? branding?.shortName ?? 'Institution';

  return (
    <Link
      href={href}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label={label}
    >
      <InstitutionMark branding={branding} size="md" />
      <span
        className={cn(
          'truncate font-display text-lg font-semibold tracking-tight text-foreground transition-all duration-200',
          collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100',
        )}
      >
        {label}
      </span>
    </Link>
  );
}
