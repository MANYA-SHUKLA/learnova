import { APP_ROUTES } from '@learnova/constants';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Activity feed removed — redirect to dashboard. */
export default async function StudentActivityRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: APP_ROUTES.STUDENT_DASHBOARD, locale });
}
