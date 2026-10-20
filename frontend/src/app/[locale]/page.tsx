import { setRequestLocale } from 'next-intl/server';
import { PlatformHomePage } from '@/components/marketing/platform-home-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/** Product marketing for colleges — campus trust pages live at /{slug} (e.g. /soe). */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader platformMarketing />
      <PlatformHomePage />
      <SiteFooter platformMarketing />
    </>
  );
}
