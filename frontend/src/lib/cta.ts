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

/** Secondary hero CTA on the product homepage */
export const platformHeroSecondaryClass = cn(
  ctaButtonClass,
  'h-[3.25rem] rounded-full border-2 border-border/80 bg-background/70 text-base font-semibold',
  'backdrop-blur-md shadow-sm',
  'transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out',
  'hover:-translate-y-1 hover:border-primary/35 hover:bg-muted/60 hover:shadow-md',
  'active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
);
