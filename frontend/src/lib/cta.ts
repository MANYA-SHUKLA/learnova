import { cn } from '@/lib/utils';

/** Shared classes for marketing CTA buttons (Get started, Join Learnova, etc.). */
export const ctaButtonClass = 'min-w-[10.5rem] px-10';
export const ctaOutlineClass = 'min-w-[10.5rem] px-10 bg-card';

/** Primary hero CTA on the product homepage */
export const platformHeroPrimaryClass = cn(
  ctaButtonClass,
  'h-[3.25rem] rounded-full text-base font-semibold tracking-tight',
  'shadow-lg shadow-primary/30 ring-2 ring-primary/25',
  'transition-[transform,box-shadow] duration-300 ease-out',
  'hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/35 hover:ring-primary/45',
  'active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
);

/** Primary “Explore modules” CTA — gradient pill with shimmer (package / discovery). */
export const platformExploreModulesClass = cn(
  'relative h-[3.5rem] min-w-[13rem] overflow-hidden rounded-full px-8 text-base font-semibold tracking-tight',
  'border-0 bg-gradient-to-r from-primary via-primary to-[#4338CA] text-primary-foreground',
  'shadow-[0_10px_32px_-8px_hsl(var(--primary)/0.55)] ring-1 ring-white/25 ring-inset',
  'transition-[transform,box-shadow,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:-translate-y-1 hover:shadow-[0_16px_44px_-10px_hsl(var(--primary)/0.65)] hover:brightness-[1.03]',
  'active:translate-y-0 active:brightness-100',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent',
  'before:-translate-x-full before:transition-transform before:duration-[850ms] before:ease-out',
  'hover:before:translate-x-full',
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:opacity-0 after:transition-opacity after:duration-500',
  'after:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] hover:after:opacity-100',
);

/** Secondary hero CTA on the product homepage */
export const platformHeroSecondaryClass = cn(
  ctaButtonClass,
  'h-[3.25rem] rounded-full border-2 border-border/80 bg-background/70 text-base font-semibold',
  'backdrop-blur-md shadow-sm',
  'transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out',
  'hover:-translate-y-1 hover:border-primary/35 hover:bg-muted/60 hover:shadow-md',
  'active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
);
