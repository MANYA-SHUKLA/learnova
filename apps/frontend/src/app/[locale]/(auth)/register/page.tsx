import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Legacy /register → institution registration (URL kept; not linked from public pages). */
export default async function RegisterRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: '/register-institution', locale });
}
