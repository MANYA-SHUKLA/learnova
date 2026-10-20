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
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
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
                className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{t(`features.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`features.${key}.description`)}
                </p>
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
                <div key={feature.title} className="rounded-2xl bg-background p-8 shadow-soft-md">
                  <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
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
            <li key={step} className="relative rounded-2xl border border-border bg-card p-6 pt-8">
              <span className="absolute -top-3 left-6 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="font-semibold">{tPlatform(`${step}Title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tPlatform(`${step}Body`)}</p>
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
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
              >
                <h3 className="font-display text-lg font-semibold">{tPlatform(`${key}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {tPlatform(`${key}Body`)}
                </p>
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
                className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
              >
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                  <span aria-hidden className="font-display text-2xl leading-none text-primary/40">
                    “
                  </span>
                  {tPlatform(`${key}Quote`)}
                </blockquote>
                <figcaption className="mt-5 border-t border-border/60 pt-4">
                  <p className="font-semibold text-foreground">{tPlatform(`${key}Name`)}</p>
                  <p className="text-sm text-muted-foreground">{tPlatform(`${key}Role`)}</p>
                </figcaption>
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
                className="group rounded-2xl border border-border bg-card px-6 py-4 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
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
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-soft-md">
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
      </section>
    </main>
  );
}
