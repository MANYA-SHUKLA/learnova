import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/lib/i18n/config';

export type PlatformMarketingI18nOverlay = {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  highlights: { title: string; body: string }[];
  pricingTitle: string;
  pricingBody: string;
  faq: { title: string; body: string }[];
};

/** CMS copy is English-only; non-English locales use message files for hero, highlights, pricing, and FAQ. */
export async function getPlatformMarketingI18nOverlay(
  locale: AppLocale,
): Promise<PlatformMarketingI18nOverlay | undefined> {
  if (locale === 'en') return undefined;

  const t = await getTranslations('marketing.platformHome');

  const faq: PlatformMarketingI18nOverlay['faq'] = [];
  for (let i = 1; i <= 5; i += 1) {
    const titleKey = `faq${i}Title` as Parameters<typeof t>[0];
    const bodyKey = `faq${i}Body` as Parameters<typeof t>[0];
    if (!t.has(titleKey) || !t.has(bodyKey)) break;
    faq.push({ title: t(titleKey), body: t(bodyKey) });
  }

  return {
    heroTitle: t('heroTitle'),
    heroSubtitle: t('heroSubtitle'),
    heroCtaLabel: t('requestDemo'),
    highlights: [
      { title: t('highlight1Title'), body: t('highlight1Body') },
      { title: t('highlight2Title'), body: t('highlight2Body') },
      { title: t('highlight3Title'), body: t('highlight3Body') },
    ],
    pricingTitle: t('pricingTitle'),
    pricingBody: t('pricingBody'),
    faq,
  };
}
