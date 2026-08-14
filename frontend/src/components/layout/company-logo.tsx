'use client';

import { APP_CONFIG } from '@/constants';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/marketing/logo-mark';

interface CompanyLogoProps {
  collapsed?: boolean;
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const markSize: Record<NonNullable<CompanyLogoProps['size']>, string> = {
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-14 text-sm',
};

const nameSize: Record<NonNullable<CompanyLogoProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function CompanyLogo({
  collapsed = false,
  href = '/',
  size = 'md',
  showName = true,
  className,
}: CompanyLogoProps) {
  const content = (
    <>
      <LogoMark className={cn(markSize[size], 'shrink-0')} />
      {showName ? (
        <span
          className={cn(
            'truncate font-display font-bold tracking-tight text-foreground transition-all duration-200',
            nameSize[size],
            collapsed ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100',
          )}
        >
          {APP_CONFIG.name}
        </span>
      ) : null}
    </>
  );

  const classes = cn('flex min-w-0 items-center gap-2.5', className);

  if (href != null) {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          'rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-label={APP_CONFIG.name}
      >
        {content}
      </Link>
    );
  }

  return <div className={classes} aria-label={APP_CONFIG.name}>{content}</div>;
}
