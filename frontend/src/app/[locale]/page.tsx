import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CampusPickerPage } from '@/components/marketing/campus-picker-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { env } from '@/config/env';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const defaultSlug = env.NEXT_PUBLIC_DEFAULT_INSTITUTION_SLUG;
  if (defaultSlug) {
    redirect(`/${locale}/campus/${defaultSlug}`);
  }

  return (
    <>
      <SiteHeader campusPortal />
      <CampusPickerPage />
      <SiteFooter campusPortal />
    </>
  );
}
