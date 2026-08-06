import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from '@/components/marketing/logo-mark';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark className="size-8" />
          <span className="font-display text-lg font-semibold tracking-tight">Learnova</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
