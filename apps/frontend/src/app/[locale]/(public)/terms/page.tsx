import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSection } from '@/components/marketing/legal-page-shell';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const linkClass = 'font-medium text-foreground underline-offset-2 hover:underline';

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('marketing.legal.terms');

  return (
    <LegalPageShell activeHref="/terms" title={t('title')} description={t('description')}>
      <LegalSection title={t('s1Title')}>
        <p>{t('s1p1')}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t('s2p1')}</p>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t('s3i1')}</li>
          <li>{t('s3i2')}</li>
          <li>{t('s3i3')}</li>
          <li>{t('s3i4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
        <p>{t('s4Intro')}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t('s4i1')}</li>
          <li>{t('s4i2')}</li>
          <li>{t('s4i3')}</li>
          <li>{t('s4i4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s5Title')}>
        <p>
          {t.rich('s5p1', {
            privacy: (chunks) => (
              <Link href="/privacy" className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </LegalSection>

      <LegalSection title={t('s6Title')}>
        <p>{t('s6p1')}</p>
      </LegalSection>

      <LegalSection title={t('s7Title')}>
        <p>{t('s7p1')}</p>
      </LegalSection>

      <LegalSection title={t('s8Title')}>
        <p>
          {t.rich('s8p1', {
            email: (chunks) => (
              <a href="mailto:shuklamanya99@gmail.com" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
