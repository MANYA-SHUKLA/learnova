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
  ArrowRight,
  LayoutGrid,
  CheckCircle2,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { publicApi } from '@/features/public/services/public-api';
import { siteContainer } from '@/lib/layout';
import { ctaButtonClass, platformHeroPrimaryClass, platformHeroSecondaryClass } from '@/lib/cta';
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

/** Full-width sections: intro column + content column (not narrow centered stacks). */
const sectionGrid = 'grid w-full gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16';
const sectionIntroCol = 'lg:col-span-4 lg:sticky lg:top-24 lg:self-start';
const sectionBodyCol = 'lg:col-span-8';

function SectionIntro({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('max-w-lg text-left', className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p> : null}
      {children}
    </div>
  );
}

function parseBuyerLine(raw: string) {
  const dash = raw.indexOf(' — ');
  if (dash < 0) return { label: raw, detail: '' };
  return { label: raw.slice(0, dash), detail: raw.slice(dash + 3) };
}

const PLATFORM_FAQ_COUNT = 5;

function platformFaqFromMessages(
  tPlatform: ReturnType<typeof useTranslations<'marketing.platformHome'>>,
) {
  const items: { title: string; body: string }[] = [];
  for (let i = 1; i <= PLATFORM_FAQ_COUNT; i += 1) {
    const titleKey = `faq${i}Title` as Parameters<typeof tPlatform>[0];
    const bodyKey = `faq${i}Body` as Parameters<typeof tPlatform>[0];
    if (!tPlatform.has(titleKey) || !tPlatform.has(bodyKey)) continue;
    items.push({ title: tPlatform(titleKey), body: tPlatform(bodyKey) });
  }
  return items;
}

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
  marketingI18n: PlatformMarketingI18nOverlay;
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

  const heroEyebrow = marketingI18n.heroEyebrow;
  const heroTitle = marketingI18n.heroTitle;
  const heroSubtitle = marketingI18n.heroSubtitle;
  const heroTagline = marketingI18n.heroTagline;
  const heroCtaLabel = marketingI18n.heroCtaLabel;

  const highlightFeatures =
    marketingI18n.highlights.length > 0 ? marketingI18n.highlights : marketing.features;

  const buyerKeys = ([1, 2, 3, 4, 5, 6] as const).filter((i) =>
    tPlatform.has(`buyer${i}` as Parameters<typeof tPlatform>[0]),
  );

  const pricingTitle = marketingI18n.pricingTitle ?? marketing.pricingTitle ?? tPlatform('pricingTitle');
  const pricingBody =
    marketingI18n.pricingBody ??
    marketing.pricingBody ??
    (tPlatform.has('pricingBody') ? tPlatform('pricingBody') : '');
  const pricingIncludeKeys = buyerKeys.slice(0, 4);

  const messageFaqs = platformFaqFromMessages(tPlatform);
  const faqItems = messageFaqs.length > 0 ? messageFaqs : marketing.faq;

  const outcomeKeys = ['outcome1', 'outcome2', 'outcome3', 'outcome4'] as const;
  const testimonialKeys = ['testimonial1', 'testimonial2', 'testimonial3', 'testimonial4'] as const;

  return (
    <main className="overflow-x-clip font-body">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background pb-16 pt-14 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,hsl(var(--primary)/0.18),transparent_55%)]" />
          <div className="absolute -left-[20%] top-1/4 size-[min(480px,70vw)] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-[15%] top-0 size-[min(420px,60vw)] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10" />
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
            }}
          />
        </div>
        <div className={siteContainer('relative grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20')}>
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-4 py-1.5 shadow-sm backdrop-blur-sm">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{heroEyebrow}</span>
            </div>
            <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06] xl:text-[3.5rem]">
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/65 bg-clip-text text-transparent">
                {heroTitle}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{heroSubtitle}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className={platformHeroPrimaryClass}>
                <a href="#request-demo" className="group inline-flex items-center gap-2">
                  {heroCtaLabel}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className={platformHeroSecondaryClass}>
                <a href="#modules" className="inline-flex items-center gap-2">
                  <LayoutGrid className="size-4 opacity-80" aria-hidden />
                  {tPlatform('exploreModules')}
                </a>
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            {heroTagline ? (
              <div className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">{tPlatform('buyerEyebrow')}</p>
                <p className="mt-4 text-lg font-medium leading-relaxed text-foreground">{heroTagline}</p>
                {buyerKeys.length > 0 ? (
                  <ul className="mt-6 space-y-3 border-t border-border/60 pt-6">
                    {buyerKeys.slice(0, 4).map((i) => {
                      const line = parseBuyerLine(tPlatform(`buyer${i}` as Parameters<typeof tPlatform>[0]));
                      return (
                        <li key={i} className="flex gap-3 text-sm">
                          <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                          <span>
                            <span className="font-semibold text-foreground">{line.label}</span>
                            {line.detail ? (
                              <span className="text-muted-foreground"> — {line.detail}</span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <Button asChild variant="link" className="mt-6 h-auto p-0 text-primary">
                  <a href="#package" className="inline-flex items-center gap-1">
                    {tPlatform('exploreModules')}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
          {heroTagline ? (
            <p className="rounded-2xl border border-border/60 bg-card/50 px-5 py-3 text-sm font-medium leading-relaxed text-muted-foreground shadow-sm backdrop-blur-sm lg:col-span-2 lg:hidden">
              {heroTagline}
            </p>
          ) : null}
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border/60 bg-muted/20 py-10 sm:py-12">
        <div className={siteContainer('w-full')}>
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {[
            { value: tPlatform('stat1Value'), label: tPlatform('stat1Label') },
            { value: tPlatform('stat2Value'), label: tPlatform('stat2Label') },
            { value: tPlatform('stat3Value'), label: tPlatform('stat3Label') },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-border/50 bg-card/60 px-6 py-5 text-left',
                marketingCardHover,
                'hover:scale-[1.02] motion-reduce:hover:scale-100',
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
        </div>
      </section>

      {buyerKeys.length > 0 ? (
        <section
          id="package"
          className="scroll-mt-24 border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-muted/30 to-background py-20 sm:py-24"
        >
          <div className={siteContainer('w-full')}>
            <div className={sectionGrid}>
              <div className={sectionIntroCol}>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Package className="size-3.5" aria-hidden />
                  {tPlatform('buyerEyebrow')}
                </div>
                <SectionIntro className="mt-5" title={tPlatform('buyerTitle')} subtitle={tPlatform('buyerSubtitle')}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button asChild size="lg" className={platformHeroPrimaryClass}>
                      <a href="#request-demo" className="group inline-flex items-center gap-2">
                        {tPlatform.has('pricingCta') ? tPlatform('pricingCta') : heroCtaLabel}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className={platformHeroSecondaryClass}>
                      <a href="#modules">{tPlatform('exploreModules')}</a>
                    </Button>
                  </div>
                </SectionIntro>
              </div>
              <ul className={cn(sectionBodyCol, 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3')}>
                {buyerKeys.map((i) => {
                  const raw = tPlatform(`buyer${i}` as Parameters<typeof tPlatform>[0]);
                  const line = parseBuyerLine(raw);
                  return (
                    <li
                      key={i}
                      className={cn(
                        'flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm',
                        marketingCardHover,
                        'overflow-visible hover:scale-[1.02] motion-reduce:hover:scale-100',
                      )}
                    >
                      <div className={marketingCardInner}>
                        <div className="flex items-start justify-between gap-2">
                          <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden />
                          <span className="font-display text-xs font-bold tabular-nums text-muted-foreground/80">
                            {String(i).padStart(2, '0')}
                          </span>
                        </div>
                        <p className="mt-3 font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {line.label}
                        </p>
                        {line.detail ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{line.detail}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* Eight modules */}
      <section id="modules" className="scroll-mt-24 border-b border-border/40 py-20 sm:py-28">
        <div className={siteContainer('w-full')}>
          <div className={sectionGrid}>
            <div className={sectionIntroCol}>
              <SectionIntro
                eyebrow={t('features.eyebrow')}
                title={t('features.title')}
                subtitle={t('features.description')}
              />
            </div>
            <div className={cn(sectionBodyCol, 'grid gap-5 sm:grid-cols-2 xl:grid-cols-2')}>
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
          </div>
        </div>
      </section>

      {/* CMS highlights */}
      {highlightFeatures.length > 0 ? (
        <section className="border-b border-border/60 bg-muted/25 py-20 sm:py-24">
          <div className={siteContainer('w-full')}>
            <div className={sectionGrid}>
              <div className={sectionIntroCol}>
                <SectionIntro title={tPlatform('highlightsTitle')} />
              </div>
              <div className={cn(sectionBodyCol, 'grid gap-6 md:grid-cols-2 xl:grid-cols-3')}>
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
          </div>
        </section>
      ) : null}

      {/* How colleges onboard */}
      <section className="py-20 sm:py-28">
        <div className={siteContainer('w-full')}>
          <div className={sectionGrid}>
            <div className={sectionIntroCol}>
              <SectionIntro
                title={tPlatform('howItWorksTitle')}
                subtitle={tPlatform('howItWorksSubtitle')}
              />
            </div>
            <ol className={cn(sectionBodyCol, 'grid list-none gap-6')}>
              {(['step1', 'step2', 'step3'] as const).map((step, i) => (
                <li
                  key={step}
                  className={cn(
                    'rounded-2xl border border-border bg-card p-6 shadow-sm',
                    marketingCardHover,
                    'overflow-visible hover:scale-[1.03] motion-reduce:hover:scale-100',
                  )}
                >
                  <div className={cn(marketingCardInner, 'flex gap-4')}>
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground shadow-md ring-4 ring-background transition-transform duration-500 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/25 motion-reduce:group-hover:scale-100"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-semibold leading-snug transition-colors duration-300 group-hover:text-primary">
                        {tPlatform(`${step}Title`)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {tPlatform(`${step}Body`)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-background py-20 sm:py-24">
        <div className={siteContainer('w-full')}>
          <div className={sectionGrid}>
            <div className={sectionIntroCol}>
              <SectionIntro title={tPlatform('outcomesTitle')} subtitle={tPlatform('outcomesSubtitle')} />
            </div>
            <div className={cn(sectionBodyCol, 'grid gap-5 sm:grid-cols-2')}>
              {outcomeKeys.map((key) => (
                <div
                  key={key}
                  className={cn(
                    'rounded-2xl border border-border/80 bg-card p-6 shadow-sm',
                    marketingCardHover,
                    'hover:scale-[1.02] motion-reduce:hover:scale-100',
                  )}
                >
                  <div
                    className={cn(
                      marketingCardInner,
                      'border-l-2 border-primary/0 pl-0 transition-[border-color,padding] duration-500 group-hover:border-primary group-hover:pl-3 motion-reduce:group-hover:pl-0',
                    )}
                  >
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
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/25 py-20 sm:py-24">
        <div className={siteContainer('w-full')}>
          <div className={sectionGrid}>
            <div className={sectionIntroCol}>
              <SectionIntro
                title={tPlatform('testimonialsTitle')}
                subtitle={tPlatform('testimonialsSubtitle')}
              />
            </div>
            <div className={cn(sectionBodyCol, 'grid gap-6 sm:grid-cols-2')}>
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
        </div>
      </section>

      {/* Pricing — full-width left intro + right checklist (not a centered card) */}
      {pricingBody ? (
        <section id="pricing" className="scroll-mt-24 border-t border-border/60 bg-muted/20 py-20 sm:py-24">
          <div className={siteContainer('w-full')}>
            <div className={cn(sectionGrid, 'lg:items-start')}>
              <div className={sectionIntroCol}>
                <SectionIntro title={pricingTitle} subtitle={pricingBody}>
                  <Button asChild size="lg" className={cn('mt-8', platformHeroPrimaryClass)}>
                    <a href="#request-demo" className="group inline-flex items-center gap-2">
                      {tPlatform.has('pricingCta') ? tPlatform('pricingCta') : heroCtaLabel}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </a>
                  </Button>
                </SectionIntro>
              </div>
              {pricingIncludeKeys.length > 0 ? (
                <div className={sectionBodyCol}>
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-2xl border border-border/80 bg-card p-8 shadow-sm sm:p-10',
                      marketingCardHover,
                      'overflow-visible hover:scale-[1.01] motion-reduce:hover:scale-100',
                    )}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
                    />
                    <div className={marketingCardInner}>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        {tPlatform('pricingIncludesLabel')}
                      </p>
                      <ul className="mt-6 space-y-4">
                        {pricingIncludeKeys.map((i) => {
                          const line = parseBuyerLine(tPlatform(`buyer${i}` as Parameters<typeof tPlatform>[0]));
                          return (
                            <li key={i} className="flex gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                              <span className="text-base leading-snug">
                                <span className="font-semibold text-foreground">{line.label}</span>
                                {line.detail ? (
                                  <span className="text-muted-foreground"> — {line.detail}</span>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border/60 bg-background py-20 sm:py-24">
        <div className={siteContainer('w-full')}>
          <div className={sectionGrid}>
            <div className={sectionIntroCol}>
              <SectionIntro title={tPlatform('faqTitle')} />
            </div>
            <div className={cn(sectionBodyCol, 'space-y-4')}>
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
        </div>
      </section>

      {tPlatform.has('closingTitle') ? (
        <section className="relative overflow-hidden border-t border-border/60 py-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-violet-500/10"
          />
          <div
            className={siteContainer(
              'relative flex w-full flex-col gap-8 text-left lg:flex-row lg:items-center lg:justify-between',
            )}
          >
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{tPlatform('closingTitle')}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{tPlatform('closingSubtitle')}</p>
            </div>
            <Button asChild size="lg" className={cn('shrink-0', platformHeroPrimaryClass)}>
              <a href="#request-demo" className="group inline-flex items-center gap-2">
                {tPlatform.has('closingCta') ? tPlatform('closingCta') : heroCtaLabel}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </a>
            </Button>
          </div>
        </section>
      ) : null}

      {/* Demo request — no login */}
      <section id="request-demo" className="scroll-mt-24 border-t border-border/60 bg-muted/30 py-20 sm:py-24">
        <div className={siteContainer('w-full')}>
          <div className={cn(sectionGrid, 'lg:items-start')}>
            <div className={sectionIntroCol}>
              <SectionIntro title={tPlatform('demoTitle')} subtitle={tPlatform('demoSubtitle')} />
            </div>
            <div className={sectionBodyCol}>
              <div
                className={cn(
                  'rounded-2xl border border-border bg-card p-8 shadow-soft-md sm:p-10',
                  marketingCardHover,
                  'overflow-visible hover:scale-[1.01] motion-reduce:hover:scale-100',
                )}
              >
                <div className={marketingCardInner}>
                  {submitted ? (
                    <p className="font-medium text-primary">{tPlatform('demoThanks')}</p>
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
          </div>
        </div>
      </section>
    </main>
  );
}
