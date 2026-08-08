import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSection } from '@/components/marketing/legal-page-shell';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const linkClass = 'font-medium text-foreground underline-offset-2 hover:underline';

export default async function SecurityPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('marketing.legal.security');

  return (
    <LegalPageShell activeHref="/security" title={t('title')} description={t('description')}>
      <LegalSection title={t('s1Title')}>
        <p>{t('s1p1')}</p>
      </LegalSection>

      <LegalSection title={t('s2Title')}>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t('s2i1')}</li>
          <li>{t('s2i2')}</li>
          <li>{t('s2i3')}</li>
          <li>{t('s2i4')}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t('s3Title')}>
        <p>{t('s3p1')}</p>
      </LegalSection>

      <LegalSection title={t('s4Title')}>
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
            email: (chunks) => (
              <a href="mailto:shuklamanya99@gmail.com" className={linkClass}>
                {chunks}
              </a>
            ),
          })}
        </p>
      </LegalSection>

      <LegalSection title={t('s6Title')}>
        <p>
          {t.rich('s6p1', {
            privacy: (chunks) => (
              <Link href="/privacy" className={linkClass}>
                {chunks}
              </Link>
            ),
            terms: (chunks) => (
              <Link href="/terms" className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
