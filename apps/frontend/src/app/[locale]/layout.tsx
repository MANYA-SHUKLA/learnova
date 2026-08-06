import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { MadeWithLoveFooter } from '@/components/shared/made-with-love-footer';
import { locales, isValidLocale } from '@/lib/i18n/config';
import { AppProviders } from '@/providers';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AppProviders>
        <div className="flex min-h-svh flex-col">
          <div className="flex-1">{children}</div>
          <MadeWithLoveFooter />
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
