import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/lib/i18n/config';

export type PlatformMarketingI18nOverlay = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  heroCtaLabel: string;
  highlights: { title: string; body: string }[];
  pricingTitle: string;
  pricingBody: string;
  faq: { title: string; body: string }[];
};

/** Message files drive hero, highlights, pricing, and FAQ on the public homepage (all locales). */
export async function getPlatformMarketingI18nOverlay(
  locale: AppLocale,
): Promise<PlatformMarketingI18nOverlay> {
  void locale;
  const t = await getTranslations('marketing.platformHome');

  const faq: PlatformMarketingI18nOverlay['faq'] = [];
  for (let i = 1; i <= 5; i += 1) {
    const titleKey = `faq${i}Title` as Parameters<typeof t>[0];
    const bodyKey = `faq${i}Body` as Parameters<typeof t>[0];
    if (!t.has(titleKey) || !t.has(bodyKey)) break;
    faq.push({ title: t(titleKey), body: t(bodyKey) });
  }

  return {
    heroEyebrow: t.has('heroEyebrow') ? t('heroEyebrow') : t('requestDemo'),
    heroTitle: t('heroTitle'),
    heroSubtitle: t('heroSubtitle'),
    heroTagline: t.has('heroTagline') ? t('heroTagline') : '',
    heroCtaLabel: t('requestDemo'),
    highlights: ([1, 2, 3] as const).flatMap((i) => {
      const titleKey = `highlight${i}Title` as Parameters<typeof t>[0];
      const bodyKey = `highlight${i}Body` as Parameters<typeof t>[0];
      if (!t.has(titleKey) || !t.has(bodyKey)) return [];
      return [{ title: t(titleKey), body: t(bodyKey) }];
    }),
    pricingTitle: t('pricingTitle'),
    pricingBody: t.has('pricingBody') ? t('pricingBody') : '',
    faq,
  };
}
