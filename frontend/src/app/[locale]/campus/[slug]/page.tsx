import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CampusPortalPage } from '@/components/marketing/campus-portal-page';
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

interface CampusPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CampusHomePage({ params }: CampusPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const portal = await fetchPortal(slug);
  if (!portal) notFound();
  const p = portal as {
    name: string;
    shortName: string;
    portalSettings?: { portalSubtitle?: string | null; officialCredit?: string | null };
  };

  return (
    <>
      <SiteHeader campusPortal />
      <CampusPortalPage portal={portal as never} campusSlug={slug} />
      <SiteFooter
        campusPortal
        campusName={p.name}
        campusTagline={p.portalSettings?.officialCredit ?? p.portalSettings?.portalSubtitle ?? undefined}
      />
    </>
  );
}
