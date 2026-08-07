import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSection } from '@/components/marketing/legal-page-shell';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const linkClass = 'font-medium text-foreground underline-offset-2 hover:underline';

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('marketing.legal.privacy');

  return (
    <LegalPageShell activeHref="/privacy" title={t('title')} description={t('description')}>
      <LegalSection title={t('s1Title')}>
        <p>{t('s1p1')}</p>
        <p>
          {t.rich('s1p2', {
            email: (chunks) => (
              <a href="mailto:shuklamanya99@gmail.com" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <p>{t('s2Intro')}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t('s2i1')}</li>
          <li>{t('s2i2')}</li>
          <li>{t('s2i3')}</li>
          <li>{t('s2i4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <p>{t('s3Intro')}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t('s3i1')}</li>
          <li>{t('s3i2')}</li>
          <li>{t('s3i3')}</li>
          <li>{t('s3i4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
        <p>{t('s4p1')}</p>
      </LegalSection>

      <LegalSection title={t('s5Title')}>
        <p>
          {t.rich('s5p1', {
            security: (chunks) => (
              <Link href="/security" className={linkClass}>
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
    </LegalPageShell>
  );
}
