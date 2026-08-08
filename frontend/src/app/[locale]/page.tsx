import { setRequestLocale } from 'next-intl/server';
import { LandingPage } from '@/components/marketing/landing-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <LandingPage />
      <SiteFooter />
    </>
  );
}
