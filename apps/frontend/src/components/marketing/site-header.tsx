'use client';

import { Button } from '@learnova/ui';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from './logo-mark';

const NAV_LINKS = [
  { href: '/#product', label: 'Product' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[var(--glass-bg)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--glass-bg)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground">
          <LogoMark />
          Learnova
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Get started</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
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
        <div className="border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-xl md:hidden">
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
                Login
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link
                href="/login"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Get started
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
