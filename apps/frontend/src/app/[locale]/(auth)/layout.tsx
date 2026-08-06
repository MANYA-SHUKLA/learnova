import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from '@/components/marketing/logo-mark';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="size-8 shrink-0" />
          <span className="font-display text-lg font-semibold tracking-tight">Learnova</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex w-full min-w-0 flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="w-full min-w-0 max-w-md">{children}</div>
      </main>
    </div>
  );
}
