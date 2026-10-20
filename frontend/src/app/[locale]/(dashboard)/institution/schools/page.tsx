import { APP_ROUTES } from '@learnova/constants';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** The institution account is the school; use departments and branches instead. */
export default async function InstitutionSchoolsRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: APP_ROUTES.INSTITUTION_DEPARTMENTS, locale });
}
