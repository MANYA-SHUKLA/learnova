import { getTranslations } from 'next-intl/server';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from './logo-mark';

const PRODUCT_LINKS = [
  { href: '/#features', labelKey: 'productLinks.features' },
  { href: '/#coding-labs', labelKey: 'productLinks.codingLabs' },
  { href: '/#ai', labelKey: 'productLinks.aiIdeation' },
  { href: '/#exams', labelKey: 'productLinks.exams' },
  { href: '/#analytics', labelKey: 'productLinks.analytics' },
] as const;

const COMPANY_LINKS = [
  { href: '/about', labelKey: 'companyLinks.about' },
  { href: '/features', labelKey: 'companyLinks.features' },
  { href: '/contact', labelKey: 'companyLinks.contact' },
  { href: '/login', labelKey: 'companyLinks.institutionLogin' },
] as const;

const LEGAL_LINKS = [
  { href: '/privacy', labelKey: 'legalLinks.privacy' },
  { href: '/terms', labelKey: 'legalLinks.terms' },
  { href: '/security', labelKey: 'legalLinks.security' },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const t = await getTranslations('marketing.footer');
  const tCommon = await getTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-muted/40">
      <div className={siteContainer('py-14 sm:py-16')}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground"
            >
              <LogoMark />
              {tCommon('appName')}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t('tagline')}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('contactLabel')}{' '}
              <a
                href="mailto:shuklamanya99@gmail.com"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                shuklamanya99@gmail.com
              </a>
            </p>
          </div>
          <FooterColumn
            title={t('product')}
            links={PRODUCT_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
          />
          <FooterColumn
            title={t('company')}
            links={COMPANY_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
          />
          <FooterColumn
            title={t('legal')}
            links={LEGAL_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
          />
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © {year} {tCommon('appName')}. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
