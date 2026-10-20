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
  inverted = false,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  inverted?: boolean;
}) {
  return (
    <div>
      <h3 className={inverted ? 'font-display text-sm font-semibold text-white' : 'font-display text-sm font-semibold text-foreground'}>
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className={
                inverted
                  ? 'text-sm text-white/70 transition-colors hover:text-white'
                  : 'text-sm text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CAMPUS_PORTAL_LINKS = [
  { href: '/login', labelKey: 'companyLinks.institutionLogin' },
  { href: '/contact', labelKey: 'companyLinks.contact' },
  { href: '/', labelKey: 'campusPortal.footerPlatformLink' },
] as const;

export async function SiteFooter({
  campusPortal = false,
  platformMarketing = false,
  campusName,
  campusTagline,
}: {
  campusPortal?: boolean;
  platformMarketing?: boolean;
  /** Override footer branding on /{slug} campus pages */
  campusName?: string;
  campusTagline?: string;
}) {
  const t = await getTranslations('marketing.footer');
  const tHeader = platformMarketing ? await getTranslations('marketing.header') : null;
  const headerLabel = (key: 'pricing' | 'requestDemo', fallback: string) =>
    tHeader?.has(key) ? tHeader(key) : fallback;
  const tCampus = campusPortal ? await getTranslations('marketing.campusPortal') : null;
  const tCommon = await getTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer
      className={
        platformMarketing
          ? 'w-full bg-[#14243A] text-white dark:bg-[#152536] dark:ring-1 dark:ring-white/6'
          : 'w-full border-t border-border bg-muted/40'
      }
    >
      <div
        className={
          platformMarketing
            ? 'mx-auto w-full max-w-[1240px] px-6 py-14 sm:py-16 lg:px-12'
            : siteContainer('py-14 sm:py-16')
        }
      >
        <div
          className={
            campusPortal
              ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-16'
          }
        >
          <div className={campusPortal ? 'sm:col-span-2' : 'sm:col-span-2 lg:col-span-1'}>
            <Link
              href="/"
              className={
                platformMarketing
                  ? 'inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-white'
                  : 'inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground'
              }
            >
              <LogoMark />
              {campusPortal
                ? (campusName ?? tCampus?.('footerCampusName') ?? tCommon('appName'))
                : tCommon('appName')}
            </Link>
            <p
              className={
                platformMarketing
                  ? 'mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base'
                  : 'mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base'
              }
            >
              {campusPortal
                ? (campusTagline ?? tCampus?.('footerTagline'))
                : t('tagline')}
            </p>
            <p className={platformMarketing ? 'mt-4 text-sm text-white/75' : 'mt-4 text-sm text-muted-foreground'}>
              {t('contactLabel')}{' '}
              <a
                href="mailto:shuklamanya99@gmail.com"
                className={
                  platformMarketing
                    ? 'font-medium text-white underline-offset-2 hover:underline'
                    : 'font-medium text-foreground underline-offset-2 hover:underline'
                }
              >
                shuklamanya99@gmail.com
              </a>
            </p>
          </div>
          {campusPortal ? (
            <FooterColumn
              title={tCampus?.('footerLinksTitle') ?? t('company')}
              links={CAMPUS_PORTAL_LINKS.map((link) => ({
                href: link.href,
                label:
                  link.labelKey === 'campusPortal.footerPlatformLink'
                    ? (tCampus?.('footerPlatformLink') ?? tCommon('appName'))
                    : t(link.labelKey),
              }))}
            />
          ) : platformMarketing ? (
            <>
              <FooterColumn
                inverted
                title={t('product')}
                links={[
                  {
                    href: '/#modules',
                    label: t.has('productLineModules') ? t('productLineModules') : 'ERP · LMS · Exams',
                  },
                  {
                    href: '/#modules',
                    label: t.has('productLineLabs') ? t('productLineLabs') : 'Coding labs · Analytics',
                  },
                  { href: '/#pricing', label: headerLabel('pricing', 'Pricing') },
                  { href: '/#request-demo', label: headerLabel('requestDemo', 'Request a demo') },
                ]}
              />
              <FooterColumn
                inverted
                title={t('company')}
                links={[
                  { href: '/about', label: t('companyLinks.about') },
                  { href: '/contact', label: t('companyLinks.contact') },
                  { href: '/login', label: t('companyLinks.institutionLogin') },
                ]}
              />
            </>
          ) : (
            <>
              <FooterColumn
                title={t('product')}
                links={PRODUCT_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
              />
              <FooterColumn
                title={t('company')}
                links={COMPANY_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
              />
            </>
          )}
          <FooterColumn
            inverted={platformMarketing}
            title={t('legal')}
            links={LEGAL_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
          />
        </div>

        <div className={platformMarketing ? 'mt-12 border-t border-white/15 pt-8' : 'mt-12 border-t border-border pt-8'}>
          <p className={platformMarketing ? 'text-sm text-white/65' : 'text-sm text-muted-foreground'}>
            © {year} {tCommon('appName')}. {t('copyright')}
          </p>
          {platformMarketing && t.has('builtBy') ? (
            <p className="mt-2 text-xs text-white/50">{t('builtBy')}</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
