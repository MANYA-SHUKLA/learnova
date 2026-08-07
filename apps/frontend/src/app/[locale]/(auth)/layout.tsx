import type { ReactNode } from 'react';
import { LogoMark } from '@/components/marketing/logo-mark';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteGutter } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <header
        className={cn(
          'relative z-10 flex items-center justify-between py-5',
          siteGutter,
        )}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="size-8 shrink-0" />
          <span className="font-display text-xl font-bold tracking-tight">Learnova</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
      <main
        className={cn(
          'relative z-10 flex w-full min-w-0 flex-1 items-start justify-center pb-16 pt-4 sm:items-center',
          siteGutter,
        )}
      >
        <div className="w-full min-w-0">{children}</div>
      </main>
    </div>
  );
}
