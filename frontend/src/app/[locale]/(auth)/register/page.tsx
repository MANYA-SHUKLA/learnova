import { APP_ROUTES } from '@learnova/constants';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Legacy /register → shared login (self-registration disabled). */
export default async function RegisterRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: APP_ROUTES.LOGIN, locale });
}
