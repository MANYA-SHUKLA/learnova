import { setRequestLocale } from 'next-intl/server';
import { CampusPortalPage } from '@/components/marketing/campus-portal-page';
import { LandingPage } from '@/components/marketing/landing-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { isSaasModeEnabled } from '@/lib/saas';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const saasMarketing = isSaasModeEnabled();

  return (
    <>
      <SiteHeader campusPortal={!saasMarketing} />
      {saasMarketing ? <LandingPage /> : <CampusPortalPage />}
      <SiteFooter campusPortal={!saasMarketing} />
    </>
  );
}
