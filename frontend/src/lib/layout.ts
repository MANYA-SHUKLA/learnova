import { cn } from '@learnova/ui';

/** Full-bleed page gutters — fills the viewport with minimal edge padding. */
export const siteGutter =
  'w-full px-[clamp(0.75rem,1.75vw,2rem)] xl:px-[clamp(1rem,2vw,2.75rem)]';

/** Marketing / app content width: edge-to-edge of the screen (no narrow max-width column). */
export function siteContainer(...extra: Array<string | undefined | false | null>) {
  return cn('mx-auto w-full max-w-none', siteGutter, ...extra);
}
