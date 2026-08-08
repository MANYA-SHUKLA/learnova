import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const LEGAL_NAV = [
  { href: '/privacy', labelKey: 'privacy' },
  { href: '/terms', labelKey: 'terms' },
  { href: '/security', labelKey: 'security' },
] as const;

interface LegalPageShellProps {
  title: string;
  description: string;
  updated?: string;
  activeHref: (typeof LEGAL_NAV)[number]['href'];
  children: ReactNode;
}

export async function LegalPageShell({
  title,
  description,
  updated,
  activeHref,
  children,
}: LegalPageShellProps) {
  const t = await getTranslations('marketing.legal.shell');
  const updatedLabel = t('lastUpdated', { date: updated ?? t('updatedDate') });

  return (
    <>
      <SiteHeader />
      <main className="w-full font-body">
        <section className="relative w-full overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.14),_transparent_55%)]"
          />
          <div className={siteContainer('relative pb-12 pt-16 sm:pb-16 sm:pt-20')}>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              {t('eyebrow')}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{updatedLabel}</p>

            <nav aria-label={t('navAria')} className="mt-8 flex flex-wrap gap-2">
              {LEGAL_NAV.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-soft-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className={siteContainer()}>
            <div className="mx-auto w-full max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {children}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
