import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CampusPortalPage } from '@/components/marketing/campus-portal-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { env } from '@/config/env';
import { isReservedCampusSlug } from '@/lib/campus-slugs';

async function fetchPortal(slug: string) {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/public/portal?slug=${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: unknown };
  return json.data;
}

interface CampusSlugPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CampusSlugPage({ params }: CampusSlugPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isReservedCampusSlug(slug)) {
    notFound();
  }

  const portal = await fetchPortal(slug);
  if (!portal) notFound();

  const p = portal as {
    name: string;
    slug: string;
    portalSettings?: { portalSubtitle?: string | null; officialCredit?: string | null };
  };

  return (
    <>
      <SiteHeader campusPortal />
      <CampusPortalPage portal={portal as never} campusSlug={p.slug} />
      <SiteFooter
        campusPortal
        campusName={p.name}
        campusTagline={p.portalSettings?.officialCredit ?? p.portalSettings?.portalSubtitle ?? undefined}
      />
    </>
  );
}
