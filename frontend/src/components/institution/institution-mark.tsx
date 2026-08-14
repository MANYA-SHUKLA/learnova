'use client';

import type { InstitutionBranding } from '@learnova/types';
import { cn } from '@/lib/utils';

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

interface InstitutionMarkProps {
  branding?: InstitutionBranding | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InstitutionMark({ branding, size = 'md', className }: InstitutionMarkProps) {
  const dims = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-7' : 'size-9';
  const text = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-[10px]' : 'text-xs';
  const logo = branding?.logo;
  const shortName = branding?.shortName ?? 'LN';

  if (logo && isLikelyUrl(logo)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        className={cn(dims, 'shrink-0 rounded-xl object-contain bg-background/80 p-1 shadow-soft-sm', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        dims,
        text,
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-gradient font-bold text-white shadow-glow',
        className,
      )}
    >
      {shortName.slice(0, 2).toUpperCase()}
    </span>
  );
}
