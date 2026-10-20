import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CampusPortalPage } from '@/components/marketing/campus-portal-page';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { isReservedCampusSlug } from '@/lib/campus-slugs';
import { fetchPublicPortal } from '@/lib/campus-portal';

interface CampusSlugPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Public campus trust page — sign-in CTA; copy is edited under Institution → Campus portal. */
export default async function CampusSlugPage({ params }: CampusSlugPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isReservedCampusSlug(slug)) notFound();

  const portal = await fetchPublicPortal(slug);
  if (!portal) notFound();

  return (
    <>
      <SiteHeader campusPortal campusSlug={portal.slug} campusName={portal.name} />
      <CampusPortalPage portal={portal} campusSlug={portal.slug} />
      <SiteFooter campusPortal campusSlug={portal.slug} supportEmail={portal.portalSettings?.supportEmail} />
    </>
  );
}
