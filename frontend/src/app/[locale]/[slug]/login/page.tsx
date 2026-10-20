import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { redirect } from '@/lib/i18n/routing';
import { campusLoginPath, isReservedCampusSlug } from '@/lib/campus-slugs';
import { fetchPublicPortal } from '@/lib/campus-portal';

interface CampusLoginPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Legacy per-campus login URLs — forward to shared institution sign-in. */
export default async function CampusLoginPage({ params }: CampusLoginPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isReservedCampusSlug(slug)) notFound();

  const portal = await fetchPublicPortal(slug);
  if (!portal) notFound();

  redirect({ href: campusLoginPath(portal.slug), locale });
}
