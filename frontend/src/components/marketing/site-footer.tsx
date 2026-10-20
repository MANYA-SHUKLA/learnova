import { Heart } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { marketingContainer } from '@/lib/marketing-design';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
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
      <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function campusPortalLinks(campusSlug?: string) {
  const loginHref = campusSlug ? `/${campusSlug.toLowerCase()}/login` : '/login';
  return [
    { href: loginHref, labelKey: 'companyLinks.institutionLogin' as const },
    { href: '/contact', labelKey: 'companyLinks.contact' as const },
    { href: '/', labelKey: 'campusPortal.footerPlatformLink' as const },
  ] as const;
}

export async function SiteFooter({
  campusPortal = false,
  platformMarketing = false,
  campusName,
  campusTagline,
  campusSlug,
  supportEmail,
}: {
  campusPortal?: boolean;
  platformMarketing?: boolean;
  /** Override footer branding on /{slug} campus pages */
  campusName?: string;
  campusTagline?: string;
  campusSlug?: string;
  supportEmail?: string | null;
}) {
  const t = await getTranslations('marketing.footer');
  const tHeader = platformMarketing ? await getTranslations('marketing.header') : null;
  const headerLabel = (key: 'pricing' | 'requestDemo', fallback: string) =>
    tHeader?.has(key) ? tHeader(key) : fallback;
  const tCampus = campusPortal ? await getTranslations('marketing.campusPortal') : null;
  const tCommon = await getTranslations('common');
  const tLove = await getTranslations('common.madeWithLove');
  const year = new Date().getFullYear();

  return (
    <footer className="w-full shrink-0 bg-[#14243A] text-white dark:bg-[#152536] dark:ring-1 dark:ring-white/6">
      <div className={cn(marketingContainer, 'py-8 sm:py-9')}>
        <div
          className={
            campusPortal
              ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8'
              : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8'
          }
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              <LogoMark />
              {campusPortal
                ? (campusName ?? tCampus?.('footerCampusName') ?? tCommon('appName'))
                : tCommon('appName')}
            </Link>
            <p className="mt-2 max-w-sm text-sm leading-snug text-white/75">
              {campusPortal
                ? (campusTagline ?? tCampus?.('footerTagline'))
                : t('tagline')}
            </p>
            {supportEmail?.includes('@') || !campusPortal ? (
              <p className="mt-2 text-sm text-white/75">
                {t('contactLabel')}{' '}
                <a
                  href={`mailto:${supportEmail?.includes('@') ? supportEmail : 'shuklamanya99@gmail.com'}`}
                  className="font-medium text-white underline-offset-2 hover:underline"
                >
                  {supportEmail?.includes('@') ? supportEmail : 'shuklamanya99@gmail.com'}
                </a>
              </p>
            ) : null}
          </div>
          {campusPortal ? (
            <div className="grid gap-6 sm:col-span-2 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2 lg:gap-8">
              <FooterColumn
                title={tCampus?.('footerLinksTitle') ?? t('company')}
                links={campusPortalLinks(campusSlug).map((link) => ({
                  href: link.href,
                  label:
                    link.labelKey === 'campusPortal.footerPlatformLink'
                      ? (tCampus?.('footerPlatformLink') ?? tCommon('appName'))
                      : t(link.labelKey),
                }))}
              />
              <FooterColumn
                title={t('legal')}
                links={LEGAL_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
              />
            </div>
          ) : platformMarketing ? (
            <>
              <FooterColumn
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
          {!campusPortal ? (
            <FooterColumn
              title={t('legal')}
              links={LEGAL_LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))}
            />
          ) : null}
        </div>

        <div className="mt-6 border-t border-white/15 pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2">
            <p className="text-sm text-white/65">
              © {year} {tCommon('appName')}. {t('copyright')}
            </p>
            {platformMarketing && t.has('builtBy') ? (
              <p className="text-sm font-medium text-white/90">{t('builtBy')}</p>
            ) : campusPortal ? (
              <p className="text-sm text-white/75 sm:text-right">
                {tCampus?.('poweredBy', { app: tCommon('appName') }) ??
                  `Powered by ${tCommon('appName')}`}
              </p>
            ) : (
              <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-sm text-white/85 sm:justify-end">
                <span>{tLove('madeWith')}</span>
                <Heart className="size-3.5 shrink-0 fill-rose-400 text-rose-400" aria-hidden />
                <span>
                  {tLove('by')}{' '}
                  <a
                    href="https://wa.me/918005586588"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white underline-offset-2 hover:text-white/95 hover:underline"
                  >
                    Manya Shukla
                  </a>
                  {' · '}
                  {tLove('project')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
