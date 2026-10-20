import { setRequestLocale } from 'next-intl/server';
import { PlatformMarketingPage } from '@/components/marketing/platform-marketing-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

interface PlatformPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PlatformPage({ params }: PlatformPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <PlatformMarketingPage />
      <SiteFooter />
    </>
  );
}
