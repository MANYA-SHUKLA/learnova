import type { ReactNode } from 'react';
import { CompanyLogo } from '@/components/layout/company-logo';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteGutter } from '@/lib/layout';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <header
        className={cn(
          'relative z-50 flex items-center justify-between py-5',
          siteGutter,
        )}
      >
        <CompanyLogo href="/" size="md" />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
      <main
        className={cn(
          'relative z-10 flex w-full min-w-0 flex-1 items-center justify-center pb-16 pt-4',
          siteGutter,
        )}
      >
        <div className="flex w-full min-w-0 justify-center">{children}</div>
      </main>
    </div>
  );
}
