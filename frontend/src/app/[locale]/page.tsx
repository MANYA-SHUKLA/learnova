import { setRequestLocale } from 'next-intl/server';
import { PlatformHomePage } from '@/components/marketing/platform-home-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { isValidLocale, type AppLocale } from '@/lib/i18n/config';
import { getPlatformMarketingI18nOverlay } from '@/lib/platform-marketing-i18n';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/** Product marketing for colleges — campus trust pages live at /{slug} (e.g. /soe). */
export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale = isValidLocale(localeParam) ? localeParam : ('en' as AppLocale);
  setRequestLocale(locale);
  const marketingI18n = await getPlatformMarketingI18nOverlay(locale);

  return (
    <>
      <SiteHeader platformMarketing />
      <PlatformHomePage marketingI18n={marketingI18n} />
      <SiteFooter platformMarketing />
    </>
  );
}
