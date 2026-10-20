import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CampusPickerPage } from '@/components/marketing/campus-picker-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { env } from '@/config/env';

async function fetchPortal(slug: string) {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/public/portal?slug=${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: unknown };
  return json.data;
}

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
