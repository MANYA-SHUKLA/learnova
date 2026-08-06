import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@learnova/constants';

export const locales = SUPPORTED_LOCALES;
export const defaultLocale = DEFAULT_LOCALE;

export type AppLocale = (typeof locales)[number];

export function isValidLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}
