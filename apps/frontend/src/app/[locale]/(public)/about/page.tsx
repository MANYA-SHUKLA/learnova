import { Button } from '@learnova/ui';
import { setRequestLocale } from 'next-intl/server';
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
    title: 'Unified learning stack',
    body: 'LMS, ERP, exams, and coding labs share one identity, one academic structure, and one source of truth.',
  },
  {
    icon: Code2,
    title: 'Build by doing',
    body: 'Cloud IDE and practice labs turn coursework into production-shaped skills with measurable mastery.',
  },
  {
    icon: Brain,
    title: 'AI with guardrails',
    body: 'Ideation and assistance stay institution-scoped, auditable, and aligned to faculty policy.',
  },
  {
    icon: LineChart,
    title: 'Outcomes over activity',
    body: 'Analytics surface where cohorts stall so leaders can intervene with clarity, not guesswork.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise trust',
    body: 'Roles, audit trails, and campus-aware governance come standard — not bolted on later.',
  },
  {
    icon: Sparkles,
    title: 'Designed for polish',
    body: 'A premium experience for students and operators alike, across light and dark themes.',
  },
] as const;

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const saasMode = isSaasModeEnabled();

  return (
    <>
      <SiteHeader />
      <main className="w-full font-body">
        <section className="relative w-full overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,_hsl(var(--primary)/0.16),_transparent_55%),radial-gradient(ellipse_40%_30%_at_85%_15%,_#7C3AED18,_transparent_50%)]"
          />
          <div className={siteContainer('relative pb-20 pt-20 text-center sm:pb-24 sm:pt-28')}>
            <p className="font-display text-5xl font-bold tracking-tight text-primary sm:text-6xl lg:text-7xl">
              Learnova
            </p>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              About the platform
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              Learnova is an enterprise AI learning platform for modern institutions — LMS, ERP,
              examinations, coding, cloud IDE, ideation, analytics, and audit in one coherent product.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href="/login">Institution Login</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className={ctaOutlineClass}>
                <Link href="/features">Explore Platform</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full border-t border-border bg-muted/30 py-20 sm:py-24">
          <div className={siteContainer()}>
            <div className="mx-auto w-full max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                What we believe
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg lg:text-xl">
                Learning infrastructure should feel as refined as the products students aspire to build.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-soft-sm sm:p-7"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-20 sm:py-24">
          <div className={siteContainer('text-center')}>
            <h2 className="mx-auto max-w-4xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Built for institutions that teach at scale
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              From program structure to exam integrity and coding mastery, Learnova gives campuses a
              single operating system for academic delivery — without sacrificing polish or control.
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href={saasMode ? '/register-institution' : '/login'}>
                  {saasMode ? 'Register Institution' : 'Institution Login'}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
