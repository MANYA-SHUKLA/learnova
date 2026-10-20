import { cn } from '@/lib/utils';

/** Favicon / brand indigo — matches `public/favicon.svg` and `--primary`. */
export const marketingPrimary = '#4F46E5';
export const marketingPrimaryHover = '#4338CA';
export const marketingPaleBlue = '#EEF2FF';

/** Learnova marketing layout — ~1240px container, institutional palette. */
export const marketingContainer = cn('mx-auto w-full max-w-[1240px] px-6 lg:px-12');

export const marketingSectionY = 'py-[88px] lg:py-[104px]';

export const marketingNavy = '#14243A';
export const marketingBorder = '#E2E8F0';
/** @deprecated use marketingPaleBlue */
export const marketingMutedBg = '#F5F7FA';

export const marketingPageBg = 'bg-white dark:bg-[#182130]';

export const marketingSectionMutedBg = 'bg-[#F5F7FA] dark:bg-[#1e2a3c]';

export const marketingEyebrow =
  'text-xs font-medium uppercase tracking-[0.12em] text-primary dark:text-indigo-300';

export const marketingHeroTitle = cn(
  'font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-[#14243A]',
  'sm:text-[3rem] lg:text-[3.375rem] dark:text-[#f1f5f9]',
);

export const marketingSectionTitle = cn(
  'font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-[#14243A]',
  'sm:text-[2.125rem] dark:text-[#f1f5f9]',
);

export const marketingBody = cn(
  'text-base leading-[1.65] text-[#475569]',
  'dark:text-[#94a3b8]',
);

/** Lift, primary glow, accent rail, and shine sweep — see `card-interactive` in globals.css */
export const marketingCard = cn(
  'card-interactive group h-full rounded-[12px] border p-6',
  'border-[#E2E8F0] bg-white text-card-foreground shadow-soft-md',
  'dark:border-white/10 dark:bg-[#243047]',
);

export const marketingCardTitle = cn(
  'text-lg font-semibold leading-snug text-[#14243A] transition-colors duration-300',
  'group-hover:text-primary dark:text-[#e2e8f0] dark:group-hover:text-indigo-300',
);

export const marketingBtnPrimary = cn(
  'inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium',
  'bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-[hsl(var(--primary-hover))]',
);

export const marketingBtnSecondary = cn(
  'inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-medium',
  'border-[#E2E8F0] bg-white text-[#14243A] transition-colors hover:bg-[#F5F7FA]',
  'dark:border-white/12 dark:bg-[#243047] dark:text-[#e2e8f0] dark:hover:bg-[#2a3850]',
);

export const marketingPill = cn(
  'rounded-lg bg-[#EEF2FF] px-3 py-1.5 text-xs font-medium text-[#14243A]',
  'dark:bg-primary/20 dark:text-[#cbd5e1]',
);

export const marketingIconTile = cn(
  'flex size-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-primary',
  'transition-all duration-300 ease-out',
  'group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md',
  'dark:bg-primary/18 dark:text-indigo-300 dark:group-hover:bg-primary dark:group-hover:text-primary-foreground',
);

export const marketingFinalCta = cn(
  'bg-[#14243A] dark:bg-[#1a3352] dark:ring-1 dark:ring-white/8',
);
