'use client';

import { Button, Skeleton } from '@learnova/ui';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { useAuth } from '@/providers/auth-provider';
import { campusLoginPath } from '@/lib/campus-slugs';
import { LogoMark } from './logo-mark';

const SAAS_NAV_LINKS = [
  { href: '/features', labelKey: 'features' },
  { href: '/#pricing', labelKey: 'pricing' },
  { href: '/#faq', labelKey: 'faq' },
  { href: '/contact', labelKey: 'contact' },
] as const;

const CAMPUS_NAV_LINKS = [
  { href: '/contact', labelKey: 'contact' },
  { href: '/privacy', labelKey: 'privacy' },
] as const;

type HeaderNavKey = 'contact' | 'features' | 'pricing' | 'faq' | 'platform' | 'solutions';

const HEADER_NAV_FALLBACK: Record<HeaderNavKey, string> = {
  platform: 'Platform',
  solutions: 'Solutions',
  features: 'Features',
  pricing: 'Pricing',
  faq: 'FAQ',
  contact: 'Contact',
};

function headerNavLabel(
  t: ReturnType<typeof useTranslations<'marketing.header'>>,
  tCommon: ReturnType<typeof useTranslations<'common'>>,
  labelKey: string,
) {
  if (labelKey === 'privacy') return tCommon('privacy');
  const key = labelKey as HeaderNavKey;
  return t.has(key) ? t(key) : HEADER_NAV_FALLBACK[key] ?? labelKey;
}

export function SiteHeader({
  campusPortal = false,
  platformMarketing = false,
  campusSlug,
  campusName,
}: {
  campusPortal?: boolean;
  /** Learnova product site at / — no sign-in CTA */
  platformMarketing?: boolean;
  campusSlug?: string;
  campusName?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('marketing.header');
  const tCommon = useTranslations('common');
  const { user, isAuthenticated, isLoading } = useAuth();

  const dashboardHref = dashboardPathForRole(user?.role);
  const showSignIn = campusPortal && !platformMarketing;
  const primaryCtaLabel = isAuthenticated
    ? t('goToDashboard')
    : platformMarketing
      ? t('requestDemo')
      : campusPortal
        ? t('signIn')
        : t('institutionLogin');
  const campusSignInHref = campusSlug ? campusLoginPath(campusSlug) : '/login';
  const primaryCtaHref = isAuthenticated
    ? dashboardHref
    : platformMarketing
      ? '/#request-demo'
      : campusPortal
        ? campusSignInHref
        : '/login';
  const navLinks = campusPortal
    ? CAMPUS_NAV_LINKS
    : platformMarketing
      ? ([
          { href: '/#modules', labelKey: 'platform' as const },
          { href: '/#workflows', labelKey: 'solutions' as const },
          { href: '/#pricing', labelKey: 'pricing' as const },
          { href: '/#faq', labelKey: 'faq' as const },
        ] as const)
      : SAAS_NAV_LINKS;

  return (
    <header
      className={
        platformMarketing
          ? 'sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-[#182130]/95'
          : 'sticky top-0 z-50 w-full border-b border-border/60 bg-[var(--glass-bg)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--glass-bg)]'
      }
    >
      <div
        className={
          platformMarketing
            ? 'mx-auto grid h-[4.5rem] w-full max-w-[1240px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6 lg:gap-10 lg:px-12'
            : siteContainer('flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]')
        }
      >
        <Link
          href={campusPortal && campusSlug ? campusSignInHref : '/'}
          className="flex min-w-0 items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          {campusPortal && campusSlug ? null : <LogoMark />}
          {campusPortal && campusName ? campusName : tCommon('appName')}
        </Link>

        <nav
          className={
            platformMarketing
              ? 'hidden items-center justify-center gap-8 lg:flex xl:gap-10'
              : 'hidden items-center gap-0.5 lg:flex'
          }
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                platformMarketing
                  ? 'rounded-lg px-2 py-2 text-sm font-medium text-[#475569] transition-colors hover:text-[#14243A] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9]'
                  : 'rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              }
            >
              {headerNavLabel(t, tCommon, link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <LanguageToggle />
          <ThemeToggle />
          {isLoading ? (
            <Skeleton className="hidden h-9 w-28 rounded-md sm:inline-flex" />
          ) : showSignIn || platformMarketing || isAuthenticated ? (
            <Button
              asChild
              size="sm"
              className={
                platformMarketing
                  ? 'hidden h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] sm:inline-flex'
                  : 'hidden sm:inline-flex'
              }
            >
              {platformMarketing && !isAuthenticated ? (
                <a href={primaryCtaHref}>{primaryCtaLabel}</a>
              ) : (
                <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
              )}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? tCommon('closeNav') : tCommon('openNav')}
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
            }}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
          <div className={siteContainer('py-4')}>
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {headerNavLabel(t, tCommon, link.labelKey)}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex items-center gap-2">
              <LanguageToggle className="shrink-0" />
              {!isLoading && (showSignIn || platformMarketing || isAuthenticated) ? (
                <Button asChild className="w-full">
                  {platformMarketing && !isAuthenticated ? (
                    <a
                      href={primaryCtaHref}
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      {primaryCtaLabel}
                    </a>
                  ) : (
                    <Link
                      href={primaryCtaHref}
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      {primaryCtaLabel}
                    </Link>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
