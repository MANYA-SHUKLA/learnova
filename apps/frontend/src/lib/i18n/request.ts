import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isValidLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isValidLocale(requested) ? requested : defaultLocale;

  const messagesModule = (await import(
    `../../../messages/${locale}.json`
  )) as { default: Record<string, unknown> };

  return {
    locale,
    messages: messagesModule.default,
  };
});
