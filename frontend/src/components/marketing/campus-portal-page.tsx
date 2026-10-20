'use client';

import { Button } from '@learnova/ui';
import { CalendarDays, GraduationCap, Shield, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { APP_CONFIG } from '@/constants';
import { ctaButtonClass } from '@/lib/cta';
import { siteContainer } from '@/lib/layout';
import { Link, useRouter } from '@/lib/i18n/routing';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const ROLE_CARDS = [
  { key: 'student' as const, icon: GraduationCap, href: '/login' },
  { key: 'faculty' as const, icon: Users, href: '/login' },
  { key: 'admin' as const, icon: Shield, href: '/login' },
];

export function CampusPortalPage() {
  const t = useTranslations('marketing.campusPortal');
  const tCommon = useTranslations('common');
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.role) return;
    router.replace(dashboardPathForRole(user.role));
  }, [isAuthenticated, isLoading, router, user?.role]);

  return (
    <main className="w-full max-w-[100vw] overflow-x-clip font-body">
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
        />

        <div className={siteContainer('relative pb-16 pt-16 sm:pb-24 sm:pt-20 lg:pt-24')}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              {t('eyebrow')}
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href="/login">{t('signInCta')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">{t('contactHelp')}</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3 sm:gap-6">
            {ROLE_CARDS.map(({ key, icon: Icon, href }) => (
              <div
                key={key}
                className="card-interactive flex flex-col rounded-2xl border border-border bg-card/90 p-6 shadow-soft-md backdrop-blur-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {t(`roles.${key}.title`)}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`roles.${key}.description`)}
                </p>
                <Button asChild variant="secondary" className="mt-6 w-full">
                  <Link href={href}>{t(`roles.${key}.cta`)}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 sm:py-12">
        <div className={siteContainer()}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                <CalendarDays className="size-6 text-primary" aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{t('notices.title')}</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>{t('notices.item1')}</li>
                  <li>{t('notices.item2')}</li>
                  <li>{t('notices.item3')}</li>
                </ul>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-5 lg:max-w-sm">
              <p className="text-sm font-medium text-foreground">{t('help.title')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('help.description')}</p>
              <a
                href={`mailto:${APP_CONFIG.supportEmail}`}
                className={cn('mt-3 inline-block text-sm font-medium text-primary hover:underline')}
              >
                {APP_CONFIG.supportEmail}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={siteContainer('py-12 sm:py-16')}>
        <p className="text-center text-xs text-muted-foreground">
          {tCommon('madeWithLove.project')} · {t('poweredBy', { app: tCommon('appName') })}
        </p>
      </section>
    </main>
  );
}
