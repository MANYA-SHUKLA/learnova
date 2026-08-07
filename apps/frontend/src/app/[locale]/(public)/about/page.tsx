import { Button } from '@learnova/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BookOpen,
  Brain,
  Code2,
  LineChart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { siteContainer } from '@/lib/layout';
import { ctaButtonClass, ctaOutlineClass } from '@/lib/cta';
import { Link } from '@/lib/i18n/routing';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

const PILLARS = [
  {
    icon: BookOpen,
    titleKey: 'pillar1Title',
    bodyKey: 'pillar1Body',
  },
  {
    icon: Code2,
    titleKey: 'pillar2Title',
    bodyKey: 'pillar2Body',
  },
  {
    icon: Brain,
    titleKey: 'pillar3Title',
    bodyKey: 'pillar3Body',
  },
  {
    icon: LineChart,
    titleKey: 'pillar4Title',
    bodyKey: 'pillar4Body',
  },
  {
    icon: ShieldCheck,
    titleKey: 'pillar5Title',
    bodyKey: 'pillar5Body',
  },
  {
    icon: Sparkles,
    titleKey: 'pillar6Title',
    bodyKey: 'pillar6Body',
  },
] as const;

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('marketing.about');

  return (
    <>
      <SiteHeader />
      <main className="w-full font-body">
        <section className="relative w-full overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.16),_transparent_55%),radial-gradient(ellipse_40%_30%_at_85%_15%,_hsl(var(--accent)/0.12),_transparent_50%)]"
          />
          <div className={siteContainer('relative pb-20 pt-20 text-center sm:pb-24 sm:pt-28')}>
            <p className="font-display text-5xl font-bold tracking-tight text-primary sm:text-6xl lg:text-7xl">
              {t('brand')}
            </p>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {t('subtitle')}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href="/login">{t('loginCta')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className={ctaOutlineClass}>
                <Link href="/features">{t('exploreCta')}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full border-t border-border bg-muted/30 py-20 sm:py-24">
          <div className={siteContainer()}>
            <div className="mx-auto w-full max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {t('believeTitle')}
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg lg:text-xl">
                {t('believeSubtitle')}
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
              {PILLARS.map(({ icon: Icon, titleKey, bodyKey }) => (
                <div
                  key={titleKey}
                  className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-soft-sm sm:p-7"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                    {t(titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t(bodyKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-20 sm:py-24">
          <div className={siteContainer('text-center')}>
            <h2 className="mx-auto max-w-4xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t('finalTitle')}
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {t('finalDescription')}
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href="/login">{t('finalCta')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
