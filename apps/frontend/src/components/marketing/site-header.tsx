'use client';

import { Button } from '@learnova/ui';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteContainer } from '@/lib/layout';
import { isSaasModeEnabled } from '@/lib/saas';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from './logo-mark';

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const saasMode = isSaasModeEnabled();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-[var(--glass-bg)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--glass-bg)]">
      <div className={siteContainer('flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]')}>
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          <LogoMark />
          Learnova
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Institution Login</Link>
          </Button>
          {saasMode ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/register-institution">Register Institution</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/contact">Request Demo</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
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
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link
                  href="/login"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Institution Login
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link
                  href={saasMode ? '/register-institution' : '/contact'}
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {saasMode ? 'Register Institution' : 'Request Demo'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
