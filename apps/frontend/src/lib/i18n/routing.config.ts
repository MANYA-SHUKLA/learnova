import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './config';

/** Edge-safe routing config — no createNavigation (middleware must import this only). */
export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});
