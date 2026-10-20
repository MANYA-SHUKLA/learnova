import { APP_ROUTES } from '@learnova/constants';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Campuses are managed at platform level; institution admin uses departments & branches. */
export default async function InstitutionCampusesRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: APP_ROUTES.INSTITUTION_DEPARTMENTS, locale });
}
