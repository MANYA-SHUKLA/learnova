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
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { PlatformDashboardPreview } from '@/components/marketing/platform-dashboard-preview';
import { publicApi } from '@/features/public/services/public-api';
import { ApiClientError } from '@/lib/api/client';
import {
  marketingBody,
  marketingBtnPrimary,
  marketingBtnSecondary,
  marketingCard,
  marketingCardTitle,
  marketingContainer,
  marketingEyebrow,
  marketingFinalCta,
  marketingHeroTitle,
  marketingIconTile,
  marketingPageBg,
  marketingPill,
  marketingSectionMutedBg,
  marketingSectionTitle,
  marketingSectionY,
} from '@/lib/marketing-design';
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

function parseBuyerLine(raw: string) {
  const dash = raw.indexOf(' — ');
  if (dash < 0) return { label: raw, detail: '' };
  return { label: raw.slice(0, dash), detail: raw.slice(dash + 3) };
}

type DemoFormState = {
  institutionName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  message: string;
};

function PlatformDemoRequestSection({
  introTitle,
  introSubtitle,
  submitted,
  thanksMessage,
  fieldInstitution,
  fieldContact,
  fieldEmail,
  fieldPhone,
  fieldMessage,
  sendingLabel,
  submitLabel,
  form,
  setForm,
  demoMutation,
}: {
  introTitle: string;
  introSubtitle: string;
  submitted: boolean;
  thanksMessage: string;
  fieldInstitution: string;
  fieldContact: string;
  fieldEmail: string;
  fieldPhone: string;
  fieldMessage: string;
  sendingLabel: string;
  submitLabel: string;
  form: DemoFormState;
  setForm: Dispatch<SetStateAction<DemoFormState>>;
  demoMutation: {
    mutateAsync: () => Promise<unknown>;
    isPending: boolean;
    error: unknown;
  };
}) {
  return (
    <section id="request-demo" className={cn('scroll-mt-24', marketingSectionMutedBg)}>
      <div className={cn(marketingContainer, marketingSectionY)}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="max-w-[560px] text-left">
            <h2 className={marketingSectionTitle}>{introTitle}</h2>
            <p className={cn('mt-4', marketingBody)}>{introSubtitle}</p>
          </div>
          <div className={cn(marketingCard, 'p-8')}>
            {submitted ? (
              <p className="font-medium text-[#16856B] dark:text-[#6ee7b7]">{thanksMessage}</p>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void demoMutation.mutateAsync();
                }}
              >
                <Input
                  className="h-12 rounded-xl"
                  placeholder={fieldInstitution}
                  value={form.institutionName}
                  onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                  required
                />
                <Input
                  className="h-12 rounded-xl"
                  placeholder={fieldContact}
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  required
                />
                <Input
                  className="h-12 rounded-xl"
                  type="email"
                  placeholder={fieldEmail}
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  required
                />
                <Input
                  className="h-12 rounded-xl"
                  placeholder={fieldPhone}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <textarea
                  className="flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  placeholder={fieldMessage}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
                {demoMutation.error instanceof ApiClientError ? (
                  <p className="text-sm text-destructive">{demoMutation.error.message}</p>
                ) : null}
                <Button type="submit" className={cn('w-full', marketingBtnPrimary)} disabled={demoMutation.isPending}>
                  {demoMutation.isPending ? sendingLabel : submitLabel}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? <p className={marketingEyebrow}>{eyebrow}</p> : null}
      <h2 className={cn(eyebrow ? 'mt-3' : '', marketingSectionTitle)}>{title}</h2>
      {subtitle ? <p className={cn('mt-4', marketingBody)}>{subtitle}</p> : null}
    </div>
  );
}

export function PlatformHomePage({
  marketingI18n,
}: {
  marketingI18n: PlatformMarketingI18nOverlay;
}) {
  const t = useTranslations('marketing.landing');
  const tPlatform = useTranslations('marketing.platformHome');
  const tCommon = useTranslations('common');

  const { data: marketing, isLoading } = useQuery({
    queryKey: ['public', 'platform-marketing'],
    queryFn: () => publicApi.getPlatformMarketing(),
  });

  const [form, setForm] = useState<DemoFormState>({
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
    const timer = window.setTimeout(scrollToHash, 80);
    return () => window.clearTimeout(timer);
  }, [isLoading, marketing]);

  if (isLoading || !marketing) {
    return (
      <div className={cn(marketingContainer, 'flex min-h-[50vh] items-center justify-center text-muted-foreground')}>
        {tCommon('loading')}
      </div>
    );
  }

  const heroEyebrow = marketingI18n.heroEyebrow;
  const heroTitle = marketingI18n.heroTitle;
  const heroSubtitle = marketingI18n.heroSubtitle;
  const heroTrust = marketingI18n.heroTagline;
  const heroCtaLabel = marketingI18n.heroCtaLabel;
  const exploreLabel = tPlatform.has('explorePlatform') ? tPlatform('explorePlatform') : tPlatform('exploreModules');

  const highlightFeatures =
    marketingI18n.highlights.length > 0 ? marketingI18n.highlights : marketing.features;

  const pricingTitle = marketingI18n.pricingTitle ?? marketing.pricingTitle ?? tPlatform('pricingTitle');
  const pricingBody =
    marketingI18n.pricingBody ??
    marketing.pricingBody ??
    (tPlatform.has('pricingBody') ? tPlatform('pricingBody') : '');

  const messageFaqs = platformFaqFromMessages(tPlatform);
  const faqItems = messageFaqs.length > 0 ? messageFaqs : marketing.faq;

  const workflowOutcomes = ['outcome1', 'outcome2', 'outcome3'] as const;
  const testimonialKeys = ['testimonial2', 'testimonial3'] as const;

  const heroPills = ['heroPill1', 'heroPill2', 'heroPill3'] as const;

  return (
    <main className={cn('marketing-site overflow-x-clip font-body', marketingPageBg)}>
      {/* Hero */}
      <section className={cn('pt-12 lg:pt-16', marketingPageBg)}>
        <div className={cn(marketingContainer, 'pb-[88px] lg:pb-[104px]')}>
          <div className="grid items-center gap-12 lg:grid-cols-[44%_56%] lg:gap-10">
            <div className="max-w-[520px] text-left">
              <p className={marketingEyebrow}>{heroEyebrow}</p>
              <h1 className={cn('mt-4', marketingHeroTitle)}>{heroTitle}</h1>
              <p className={cn('mt-5 max-w-[560px]', marketingBody)}>{heroSubtitle}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {heroPills.map((key) =>
                  tPlatform.has(key) ? (
                    <span key={key} className={marketingPill}>
                      {tPlatform(key)}
                    </span>
                  ) : null,
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className={marketingBtnPrimary}>
                  <a href="#request-demo" className="group inline-flex items-center gap-2">
                    {heroCtaLabel}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </a>
                </Button>
                <Button asChild variant="outline" className={marketingBtnSecondary}>
                  <a href="#modules">{exploreLabel}</a>
                </Button>
              </div>
              {heroTrust ? (
                <p className="mt-6 text-sm leading-relaxed text-[#64748B] dark:text-[#94a3b8]">{heroTrust}</p>
              ) : null}
            </div>
            <PlatformDashboardPreview className="w-full lg:max-w-none" />
          </div>
        </div>
      </section>

      {/* Platform modules */}
      <section id="modules" className={cn('scroll-mt-24', marketingPageBg, marketingSectionY)}>
        <div className={marketingContainer}>
          <SectionHeading
            eyebrow={t('features.eyebrow')}
            title={t('features.title')}
            subtitle={t('features.description')}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {moduleKeys.map((key) => {
              const Icon = MODULE_ICONS[key] ?? BarChart3;
              return (
                <div key={key} className={cn(marketingCard, 'flex flex-col')}>
                  <div className={marketingIconTile}>
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className={cn('mt-4', marketingCardTitle)}>{t(`features.${key}.title`)}</h3>
                  <p className={cn('mt-2 flex-1 text-sm leading-relaxed', marketingBody)}>
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Academic workflows */}
      <section id="workflows" className={cn('scroll-mt-24', marketingSectionMutedBg)}>
        <div className={cn(marketingContainer, marketingSectionY)}>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div className="max-w-[560px] text-left">
              <h2 className={marketingSectionTitle}>{tPlatform('workflowsTitle')}</h2>
              <p className={cn('mt-4', marketingBody)}>{tPlatform('workflowsSubtitle')}</p>
              <ul className="mt-10 space-y-4">
                {workflowOutcomes.map((key) => (
                  <li key={key} className="flex gap-3 text-left">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#16856B] dark:text-[#6ee7b7]" aria-hidden />
                    <div>
                      <p className="font-semibold text-[#14243A] dark:text-[#e2e8f0]">
                        {tPlatform(`${key}Title`)}
                      </p>
                      <p className={cn('mt-1 text-sm', marketingBody)}>{tPlatform(`${key}Body`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <PlatformDashboardPreview />
          </div>
          <ol className="mt-16 grid gap-6 sm:grid-cols-3">
            {(['step1', 'step2', 'step3'] as const).map((step, i) => (
              <li key={step} className={cn(marketingCard, 'text-left')}>
                <span className="text-sm font-semibold text-primary dark:text-indigo-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={cn('mt-2', marketingCardTitle)}>{tPlatform(`${step}Title`)}</h3>
                <p className={cn('mt-2 text-sm', marketingBody)}>{tPlatform(`${step}Body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trust & administration */}
      {highlightFeatures.length > 0 ? (
        <section id="trust" className={cn('scroll-mt-24', marketingPageBg, marketingSectionY)}>
          <div className={marketingContainer}>
            <SectionHeading title={tPlatform('highlightsTitle')} />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {highlightFeatures.map((feature) => (
                <div key={feature.title} className={cn(marketingCard, 'text-left')}>
                  <h3 className={marketingCardTitle}>{feature.title}</h3>
                  <p className={cn('mt-3 text-sm', marketingBody)}>{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Procurement — once */}
      <section id="procurement" className={cn('scroll-mt-24', marketingSectionMutedBg)}>
        <div className={cn(marketingContainer, marketingSectionY)}>
          <div className="max-w-[650px] text-left">
            <p className={marketingEyebrow}>{tPlatform('buyerEyebrow')}</p>
            <h2 className={cn('mt-3', marketingSectionTitle)}>
              {tPlatform.has('procurementTitle') ? tPlatform('procurementTitle') : tPlatform('buyerTitle')}
            </h2>
            <p className={cn('mt-4', marketingBody)}>
              {tPlatform.has('procurementBody') ? tPlatform('procurementBody') : tPlatform('buyerSubtitle')}
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => {
              if (!tPlatform.has(`buyer${i}` as Parameters<typeof tPlatform>[0])) return null;
              const line = parseBuyerLine(tPlatform(`buyer${i}` as Parameters<typeof tPlatform>[0]));
              return (
                <li key={i} className={cn(marketingCard, 'text-left')}>
                  <p className="text-sm font-semibold text-[#14243A] dark:text-[#e2e8f0]">{line.label}</p>
                  {line.detail ? <p className={cn('mt-1 text-sm', marketingBody)}>{line.detail}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className={cn(marketingPageBg, marketingSectionY)}>
        <div className={marketingContainer}>
          <SectionHeading
            title={tPlatform('testimonialsTitle')}
            subtitle={tPlatform('testimonialsSubtitle')}
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {testimonialKeys.map((key) => (
              <figure key={key} className={cn(marketingCard, 'text-left')}>
                <blockquote className={cn('text-sm leading-relaxed', marketingBody)}>
                  {tPlatform(`${key}Quote`)}
                </blockquote>
                <figcaption className="mt-5">
                  <p className="font-semibold text-[#14243A] dark:text-[#e2e8f0]">{tPlatform(`${key}Name`)}</p>
                  <p className="text-sm text-[#64748B] dark:text-[#94a3b8]">{tPlatform(`${key}Role`)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {pricingBody ? (
        <section id="pricing" className={cn('scroll-mt-24', marketingPageBg, marketingSectionY)}>
          <div className={marketingContainer}>
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div className="max-w-[560px] text-left">
                <h2 className={marketingSectionTitle}>{pricingTitle}</h2>
                <p className={cn('mt-4', marketingBody)}>{pricingBody}</p>
                <Button asChild className={cn('mt-8', marketingBtnPrimary)}>
                  <a href="#request-demo">{tPlatform.has('pricingCta') ? tPlatform('pricingCta') : heroCtaLabel}</a>
                </Button>
              </div>
              <div className="space-y-4">
                {(
                  [
                    ['pricingModulesLabel', 'pricingModulesBody'],
                    ['pricingFitLabel', 'pricingFitBody'],
                    ['pricingNextLabel', 'pricingNextBody'],
                  ] as const
                ).map(([labelKey, bodyKey]) =>
                  tPlatform.has(labelKey) && tPlatform.has(bodyKey) ? (
                    <div key={labelKey} className={cn(marketingCard, 'text-left')}>
                      <p className="text-xs font-medium uppercase tracking-wider text-primary dark:text-indigo-300">
                        {tPlatform(labelKey)}
                      </p>
                      <p className={cn('mt-2 text-sm', marketingBody)}>{tPlatform(bodyKey)}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section id="faq" className={cn('scroll-mt-24', marketingSectionMutedBg, marketingSectionY)}>
        <div className={marketingContainer}>
          <SectionHeading title={tPlatform('faqTitle')} />
          <div className="mx-auto mt-10 max-w-3xl space-y-3 text-left">
            {faqItems.map((item) => (
              <details key={item.title} className={cn(marketingCard, 'px-6 py-4')}>
                <summary className="cursor-pointer list-none font-medium text-[#14243A] marker:content-none [&::-webkit-details-marker]:hidden dark:text-[#e2e8f0]">
                  {item.title}
                </summary>
                <p className={cn('mt-3 text-sm', marketingBody)}>{item.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <PlatformDemoRequestSection
        introTitle={tPlatform('demoTitle')}
        introSubtitle={tPlatform('demoSubtitle')}
        submitted={submitted}
        thanksMessage={tPlatform('demoThanks')}
        fieldInstitution={tPlatform('fieldInstitution')}
        fieldContact={tPlatform('fieldContact')}
        fieldEmail={tPlatform('fieldEmail')}
        fieldPhone={
          tPlatform.has('fieldPhoneOptional') ? tPlatform('fieldPhoneOptional') : tPlatform('fieldPhone')
        }
        fieldMessage={tPlatform('fieldMessage')}
        sendingLabel={tPlatform('sending')}
        submitLabel={tPlatform('submitDemo')}
        form={form}
        setForm={setForm}
        demoMutation={demoMutation}
      />

      {/* Final CTA */}
      {tPlatform.has('closingTitle') ? (
        <section className={cn(marketingFinalCta, 'py-16 text-white sm:py-20')}>
          <div className={cn(marketingContainer, 'flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between')}>
            <div className="max-w-xl text-left">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{tPlatform('closingTitle')}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/80">{tPlatform('closingSubtitle')}</p>
            </div>
            <Button
              asChild
              className={cn(
                marketingBtnPrimary,
                'shrink-0 bg-white text-[#14243A] hover:bg-white/90 dark:bg-[#f1f5f9] dark:text-[#14243A] dark:hover:bg-white',
              )}
            >
              <a href="#request-demo">{tPlatform.has('closingCta') ? tPlatform('closingCta') : heroCtaLabel}</a>
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
