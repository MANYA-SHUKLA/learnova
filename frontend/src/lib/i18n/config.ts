export const locales = ['en', 'hi', 'te'] as const;
export const defaultLocale = 'en' as const;

export type AppLocale = (typeof locales)[number];

export function isValidLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}
