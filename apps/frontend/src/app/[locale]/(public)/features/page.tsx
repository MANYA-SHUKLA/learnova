import { APP_ROUTES } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { setRequestLocale } from 'next-intl/server';
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
import { ctaButtonClass, ctaOutlineClass } from '@/lib/cta';
import { siteContainer } from '@/lib/layout';
import { isSaasModeEnabled } from '@/lib/saas';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'LMS & curriculum',
    body: 'Courses, cohorts, and content delivery aligned to your academic structure.',
  },
  {
    icon: ClipboardCheck,
    title: 'Exams',
    body: 'Secure assessment workflows with scheduling hooks and results integrity.',
  },
  {
    icon: Code2,
    title: 'Coding labs',
    body: 'Hands-on practice with feedback loops designed for institutional scale.',
  },
  {
    icon: Terminal,
    title: 'Cloud IDE',
    body: 'Browser workspaces ready for assignments and projects.',
  },
  {
    icon: LineChart,
    title: 'Analytics',
    body: 'See where cohorts stall and intervene with clarity.',
  },
  {
    icon: ShieldCheck,
    title: 'Governance',
    body: 'Roles, sessions, and audit trails for enterprise trust.',
  },
] as const;

export default async function FeaturesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const saasMode = isSaasModeEnabled();

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
              Learnova
            </p>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Explore the platform
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              An enterprise AI learning stack — LMS, exams, coding, and analytics — under one
              institutional identity.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href={APP_ROUTES.LOGIN}>Institution Login</Link>
              </Button>
              {saasMode ? (
                <Button asChild variant="outline" size="lg" className={ctaOutlineClass}>
                  <Link href={APP_ROUTES.REGISTER_INSTITUTION}>Register Institution</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="lg" className={ctaOutlineClass}>
                  <Link href={APP_ROUTES.CONTACT}>Request Demo</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className={siteContainer()}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-soft-sm sm:p-7"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {body}
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
