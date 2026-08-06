import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isValidLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isValidLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default as Record<
      string,
      unknown
    >,
  };
});
