'use client';

import { Button, Input } from '@learnova/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardCheck,
  Code2,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { publicApi } from '@/features/public/services/public-api';
import { siteContainer } from '@/lib/layout';
import { ctaButtonClass } from '@/lib/cta';
import { ApiClientError } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { PlatformMarketingI18nOverlay } from '@/lib/platform-marketing-i18n';

/** Expressive card hover — lift, glow, gradient sheen (respects reduced motion). */
const marketingCardHover = cn(
  'group relative overflow-hidden',
  'transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/15',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm',
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]',
  'before:bg-gradient-to-br before:from-primary/[0.12] before:via-primary/[0.04] before:to-transparent',
  'before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100',
  'after:pointer-events-none after:absolute after:-right-8 after:-top-8 after:size-32 after:rounded-full',
  'after:bg-primary/20 after:blur-2xl after:opacity-0 after:transition-opacity after:duration-700',
  'group-hover:after:opacity-100',
);

const marketingCardInner = 'relative z-[1]';

const MODULE_ICONS: Record<string, LucideIcon> = {
  lms: BookOpen,
  erp: GraduationCap,
  exams: ClipboardCheck,
  codingLabs: Code2,
  cloudIDE: Sparkles,
  aiIdeation: Brain,
  analytics: LineChart,
  audit: ShieldCheck,
};

export function PlatformHomePage({
  marketingI18n,
}: {
  /** Resolved on the server from locale — overrides English CMS fields for hi/te. */
  marketingI18n?: PlatformMarketingI18nOverlay;
}) {
  const t = useTranslations('marketing.landing');
  const tPlatform = useTranslations('marketing.platformHome');
  const tCommon = useTranslations('common');

  const { data: marketing, isLoading } = useQuery({
    queryKey: ['public', 'platform-marketing'],
    queryFn: () => publicApi.getPlatformMarketing(),
  });

  const [form, setForm] = useState({
    institutionName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const demoMutation = useMutation({
    mutationFn: () => publicApi.createDemoRequest(form),
    onSuccess: () => setSubmitted(true),
  });

  const moduleKeys = [
    'lms',
    'erp',
    'exams',
    'codingLabs',
    'cloudIDE',
    'aiIdeation',
    'analytics',
    'audit',
  ] as const;

  useEffect(() => {
    if (isLoading || !marketing) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const scrollToHash = () => {
      const target = document.getElementById(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const t = window.setTimeout(scrollToHash, 80);
    return () => window.clearTimeout(t);
  }, [isLoading, marketing]);

  if (isLoading || !marketing) {
    return (
      <div className={siteContainer('flex min-h-[50vh] items-center justify-center text-muted-foreground')}>
        {tCommon('loading')}
      </div>
    );
  }

  const heroTitle = marketingI18n?.heroTitle ?? marketing.heroTitle;
  const heroSubtitle = marketingI18n?.heroSubtitle ?? marketing.heroSubtitle;
  const heroCtaLabel = marketingI18n?.heroCtaLabel ?? marketing.heroCtaLabel ?? tPlatform('requestDemo');

  const highlightFeatures = marketingI18n?.highlights.length
    ? marketingI18n.highlights
    : marketing.features;

  const pricingTitle = marketingI18n?.pricingTitle ?? marketing.pricingTitle ?? tPlatform('pricingTitle');
  const pricingBody = marketingI18n?.pricingBody ?? marketing.pricingBody;

  const faqItems = marketingI18n?.faq.length ? marketingI18n.faq : marketing.faq;

  const outcomeKeys = ['outcome1', 'outcome2', 'outcome3', 'outcome4'] as const;
  const testimonialKeys = ['testimonial1', 'testimonial2', 'testimonial3', 'testimonial4'] as const;

  return (
    <main className="overflow-x-clip font-body">
      {/* Hero — clean, Google-inspired spacing */}
      <section className="relative border-b border-border/60 bg-background pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
        />
        <div className={siteContainer('relative mx-auto max-w-4xl text-center')}>
          <p className="text-sm font-medium tracking-wide text-primary">{t('hero.brand')}</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            {heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {heroSubtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className={cn('h-12 px-8 text-base', ctaButtonClass)}>
              <a href="#request-demo">{heroCtaLabel}</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <a href="#modules">{tPlatform('exploreModules')}</a>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border/60 bg-muted/20 py-10">
        <div className={siteContainer('grid gap-8 sm:grid-cols-3')}>
          {[
            { value: tPlatform('stat1Value'), label: tPlatform('stat1Label') },
            { value: tPlatform('stat2Value'), label: tPlatform('stat2Label') },
            { value: tPlatform('stat3Value'), label: tPlatform('stat3Label') },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-transparent px-4 py-5 text-center',
                marketingCardHover,
                'hover:scale-[1.03] motion-reduce:hover:scale-100',
              )}
            >
              <div className={marketingCardInner}>
                <p className="font-display text-3xl font-bold text-foreground transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eight modules */}
      <section id="modules" className={siteContainer('scroll-mt-24 py-20 sm:py-28')}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t('features.eyebrow')}</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('features.title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('features.description')}</p>
        </div>
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {moduleKeys.map((key) => {
            const Icon = MODULE_ICONS[key] ?? BarChart3;
            return (
              <div
                key={key}
                className={cn(
                  'rounded-2xl border border-border/80 bg-card p-6 shadow-sm',
                  marketingCardHover,
                  'hover:scale-[1.02] motion-reduce:hover:scale-100',
                )}
              >
                <div className={marketingCardInner}>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-md group-hover:shadow-primary/20 motion-reduce:group-hover:scale-100">
                    <Icon
                      className="size-5 transition-transform duration-500 group-hover:-rotate-6 motion-reduce:group-hover:rotate-0"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold transition-colors duration-300 group-hover:text-primary">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CMS highlights */}
      {highlightFeatures.length > 0 ? (
        <section className="border-y border-border/60 bg-muted/25 py-20">
          <div className={siteContainer('max-w-6xl')}>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{tPlatform('highlightsTitle')}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {highlightFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className={cn(
                    'rounded-2xl border border-border/60 bg-background p-8 shadow-soft-md',
                    marketingCardHover,
                    'hover:scale-[1.02] motion-reduce:hover:scale-100',
                  )}
                >
                  <div className={marketingCardInner}>
                    <h3 className="font-display text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* How colleges onboard */}
      <section className={siteContainer('py-20 sm:py-28')}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold">{tPlatform('howItWorksTitle')}</h2>
          <p className="mt-4 text-muted-foreground">{tPlatform('howItWorksSubtitle')}</p>
        </div>
        <ol className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {(['step1', 'step2', 'step3'] as const).map((step, i) => (
            <li
              key={step}
              className={cn(
                'relative rounded-2xl border border-border bg-card p-6 pt-8 shadow-sm',
                marketingCardHover,
                'hover:scale-[1.03] motion-reduce:hover:scale-100',
              )}
            >
              <span className="absolute -top-3 left-6 z-[2] flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 motion-reduce:group-hover:scale-100">
                {i + 1}
              </span>
              <div className={marketingCardInner}>
                <h3 className="font-semibold transition-colors duration-300 group-hover:text-primary">
                  {tPlatform(`${step}Title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{tPlatform(`${step}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border/60 bg-background py-20 sm:py-24">
        <div className={siteContainer('max-w-6xl')}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {tPlatform('outcomesTitle')}
            </h2>
            <p className="mt-4 text-muted-foreground">{tPlatform('outcomesSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {outcomeKeys.map((key) => (
              <div
                key={key}
                className={cn(
                  'rounded-2xl border border-border/80 bg-card p-6 shadow-sm',
                  marketingCardHover,
                  'hover:scale-[1.02] motion-reduce:hover:scale-100',
                )}
              >
                <div className={cn(marketingCardInner, 'border-l-2 border-primary/0 pl-0 transition-[border-color,padding] duration-500 group-hover:border-primary group-hover:pl-3 motion-reduce:group-hover:pl-0')}>
                  <h3 className="font-display text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
                    {tPlatform(`${key}Title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tPlatform(`${key}Body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/25 py-20 sm:py-24">
        <div className={siteContainer('max-w-6xl')}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {tPlatform('testimonialsTitle')}
            </h2>
            <p className="mt-4 text-muted-foreground">{tPlatform('testimonialsSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {testimonialKeys.map((key) => (
              <figure
                key={key}
                className={cn(
                  'flex h-full flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm',
                  marketingCardHover,
                  'hover:scale-[1.02] hover:rotate-[0.35deg] motion-reduce:hover:scale-100 motion-reduce:hover:rotate-0',
                )}
              >
                <div className={marketingCardInner}>
                  <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                    <span
                      aria-hidden
                      className="font-display text-3xl leading-none text-primary/30 transition-all duration-500 group-hover:text-primary/60 group-hover:scale-110 motion-reduce:group-hover:scale-100"
                    >
                      “
                    </span>
                    {tPlatform(`${key}Quote`)}
                  </blockquote>
                  <figcaption className="mt-5 border-t border-border/60 pt-4 transition-colors duration-300 group-hover:border-primary/30">
                    <p className="font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                      {tPlatform(`${key}Name`)}
                    </p>
                    <p className="text-sm text-muted-foreground">{tPlatform(`${key}Role`)}</p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {pricingBody ? (
        <section id="pricing" className="scroll-mt-24 border-t border-border/60 bg-muted/20 py-20">
          <div className={siteContainer('mx-auto max-w-3xl')}>
            <h2 className="font-display text-3xl font-bold">{pricingTitle}</h2>
            <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {pricingBody}
            </p>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border/60 bg-background py-20">
        <div className={siteContainer('mx-auto max-w-3xl')}>
          <h2 className="font-display text-3xl font-bold">{tPlatform('faqTitle')}</h2>
          <div className="mt-10 space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.title}
                className={cn(
                  'group rounded-2xl border border-border bg-card px-6 py-4 open:shadow-md open:shadow-primary/10',
                  'transition-[transform,box-shadow,border-color] duration-300 ease-out',
                  'hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10',
                  'motion-reduce:hover:translate-y-0',
                )}
              >
                <summary className="cursor-pointer list-none font-medium transition-colors duration-300 marker:content-none group-hover:text-primary [&::-webkit-details-marker]:hidden">
                  {item.title}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Demo request — no login */}
      <section id="request-demo" className="scroll-mt-24 border-t border-border/60 bg-muted/30 py-20">
        <div className={siteContainer('mx-auto max-w-xl')}>
          <h2 className="font-display text-3xl font-bold text-center">{tPlatform('demoTitle')}</h2>
          <p className="mt-3 text-center text-muted-foreground">{tPlatform('demoSubtitle')}</p>
          <div
            className={cn(
              'mt-10 rounded-2xl border border-border bg-card p-8 shadow-soft-md',
              marketingCardHover,
              'hover:scale-[1.01] motion-reduce:hover:scale-100',
            )}
          >
            <div className={marketingCardInner}>
            {submitted ? (
              <p className="text-center font-medium text-primary">{tPlatform('demoThanks')}</p>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void demoMutation.mutateAsync();
                }}
              >
                <Input
                  placeholder={tPlatform('fieldInstitution')}
                  value={form.institutionName}
                  onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                  required
                />
                <Input
                  placeholder={tPlatform('fieldContact')}
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder={tPlatform('fieldEmail')}
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  required
                />
                <Input
                  placeholder={tPlatform('fieldPhone')}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
                <textarea
                  className="flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  placeholder={tPlatform('fieldMessage')}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
                {demoMutation.error instanceof ApiClientError ? (
                  <p className="text-sm text-destructive">{demoMutation.error.message}</p>
                ) : null}
                <Button type="submit" className={cn('w-full', ctaButtonClass)} disabled={demoMutation.isPending}>
                  {demoMutation.isPending ? tPlatform('sending') : tPlatform('submitDemo')}
                </Button>
              </form>
            )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
