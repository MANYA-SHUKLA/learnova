/**
 * Tailwind preset reference for Learnova apps.
 * With Tailwind v4, theme tokens live in CSS (@theme).
 * This file documents shared content paths for tooling.
 */
export const learnovaTailwindContent = [
  './src/**/*.{ts,tsx}',
  '../../packages/ui/src/**/*.{ts,tsx}',
] as const;

export default {
  content: learnovaTailwindContent,
};
