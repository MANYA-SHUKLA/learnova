import { cn } from '@learnova/ui';

/** Full-bleed page gutters — fills the viewport with minimal edge padding. */
export const siteGutter =
  'w-full px-[clamp(1rem,2.5vw,2.5rem)] xl:px-[clamp(1.5rem,3vw,3.5rem)]';

/** Marketing / app content width: edge-to-edge of the screen (no narrow max-width column). */
export function siteContainer(...extra: Array<string | undefined | false | null>) {
  return cn('mx-auto w-full max-w-none', siteGutter, ...extra);
}
