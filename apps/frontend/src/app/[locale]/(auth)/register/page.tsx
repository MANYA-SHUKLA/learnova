import { setRequestLocale } from 'next-intl/server';
import { isSaasModeEnabled } from '@/lib/saas';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Legacy /register — no public user signup; registration only when SaaS mode is on. */
export default async function RegisterRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({
    href: isSaasModeEnabled() ? '/register-institution' : '/login',
    locale,
  });
}
