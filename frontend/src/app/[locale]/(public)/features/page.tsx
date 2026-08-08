import { APP_ROUTES } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BookOpen,
  ClipboardCheck,
  Code2,
  LineChart,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { ctaButtonClass } from '@/lib/cta';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const FEATURES = [
  {
    icon: BookOpen,
    titleKey: 'lmsTitle',
    bodyKey: 'lmsBody',
  },
  {
    icon: ClipboardCheck,
    titleKey: 'examsTitle',
    bodyKey: 'examsBody',
  },
  {
    icon: Code2,
    titleKey: 'codingLabsTitle',
    bodyKey: 'codingLabsBody',
  },
  {
    icon: Terminal,
    titleKey: 'cloudIDETitle',
    bodyKey: 'cloudIDEBody',
  },
  {
    icon: LineChart,
    titleKey: 'analyticsTitle',
    bodyKey: 'analyticsBody',
  },
  {
    icon: ShieldCheck,
    titleKey: 'governanceTitle',
    bodyKey: 'governanceBody',
  },
] as const;

export default async function FeaturesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('marketing.features');

  return (
    <>
      <SiteHeader />
      <main className="w-full font-body">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-hero"
          />
          <div className={siteContainer('relative pb-16 pt-20 text-center sm:pb-20 sm:pt-24')}>
            <p className="font-display text-5xl font-bold tracking-tight text-primary sm:text-6xl">
              {t('brand')}
            </p>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href={APP_ROUTES.LOGIN}>{t('cta')}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className={siteContainer()}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, titleKey, bodyKey }) => (
                <div
                  key={titleKey}
                  className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-soft-sm sm:p-7"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="mt-5 font-display text-lg font-semibold text-foreground">
                    {t(titleKey)}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t(bodyKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
