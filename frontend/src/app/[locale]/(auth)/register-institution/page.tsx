import { APP_ROUTES } from '@learnova/constants';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Institution onboarding is provisioned by Learnova — no public self-registration. */
export default async function RegisterInstitutionRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: APP_ROUTES.LOGIN, locale });
}
