'use client';

import { Button } from '@learnova/ui';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from './logo-mark';

const NAV_LINKS = [
  { href: '/features', labelKey: 'features' },
  { href: '/#pricing', labelKey: 'pricing' },
  { href: '/#faq', labelKey: 'faq' },
  { href: '/contact', labelKey: 'contact' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('marketing.header');
  const tCommon = useTranslations('common');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-[var(--glass-bg)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--glass-bg)]">
      <div className={siteContainer('flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]')}>
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          <LogoMark />
          {tCommon('appName')}
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t('institutionLogin')}</Link>
          </Button>
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex items-center gap-2">
              <LanguageToggle className="shrink-0" />
              <Button asChild className="w-full">
                <Link
                  href="/login"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {t('institutionLogin')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
