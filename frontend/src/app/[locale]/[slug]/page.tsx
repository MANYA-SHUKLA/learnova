import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { redirect } from '@/lib/i18n/routing';
import { campusLoginPath, isReservedCampusSlug } from '@/lib/campus-slugs';
import { fetchPublicPortal } from '@/lib/campus-portal';

interface CampusSlugPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Public campus root — each institution uses its own sign-in URL. */
export default async function CampusSlugPage({ params }: CampusSlugPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isReservedCampusSlug(slug)) notFound();

  const portal = await fetchPublicPortal(slug);
  if (!portal) notFound();

  redirect({ href: campusLoginPath(portal.slug), locale });
}
