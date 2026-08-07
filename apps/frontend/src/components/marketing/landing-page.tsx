'use client';

import { Button } from '@learnova/ui';
import { motion, type Variants } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ClipboardCheck,
  Code2,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  LineChart,
  ShieldCheck,
  Sparkles,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { siteContainer } from '@/lib/layout';
import { ctaButtonClass } from '@/lib/cta';
import { Link } from '@/lib/i18n/routing';
import { dashboardPathForRole } from '@/lib/auth/redirects';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function MotionSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl text-center', className)}>
      {eyebrow ? (
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary sm:text-base">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl xl:text-[3.25rem] xl:leading-[1.1]">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
        {description}
      </p>
    </div>
  );
}

/* ─── Hero ─── */

function HeroVisual() {
  const tNav = useTranslations('nav');
  const navItems = [
    tNav('overview'),
    tNav('courses'),
    tNav('labs'),
    tNav('exams'),
    tNav('analytics'),
  ] as const;
  const mobileItems = navItems.slice(0, 4);

  return (
    <div
      className="relative mx-auto w-full"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-soft-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">learnova.app / dashboard</span>
        </div>
        <div className="grid min-h-[220px] grid-cols-1 sm:min-h-[320px] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:min-h-[380px]">
          <aside className="hidden space-y-2 border-b border-border bg-muted/40 p-3 sm:block sm:border-b-0 sm:border-r sm:p-4">
            {navItems.map((item, i) => (
              <div
                key={item}
                className={cn(
                  'rounded-lg px-2.5 py-2 text-xs font-medium sm:text-sm',
                  i === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                {item}
              </div>
            ))}
          </aside>
          <div className="min-w-0 space-y-3 p-3 sm:space-y-4 sm:p-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
              {mobileItems.map((item, i) => (
                <div
                  key={item}
                  className={cn(
                    'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                    i === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="h-3 w-24 max-w-full rounded bg-muted sm:w-32" />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[68, 42, 91].map((n) => (
                <div key={n} className="card-interactive min-w-0 rounded-xl border border-border bg-background p-2.5 shadow-soft-sm sm:p-3">
                  <div className="h-2 w-8 max-w-full rounded bg-muted sm:w-10" />
                  <p className="mt-2 font-display text-base font-semibold text-foreground sm:text-xl">{n}%</p>
                </div>
              ))}
            </div>
            <div className="card-interactive rounded-xl border border-border bg-background p-3 sm:p-4">
              <div className="mb-3 flex items-end gap-1.5 sm:gap-2">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/80 to-accent/50"
                    style={{ height: `${String(h * 0.7)}px` }}
                  />
                ))}
              </div>
              <div className="h-2 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const t = useTranslations('marketing.landing.hero');
  const tHeader = useTranslations('marketing.header');
  const { user, isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? dashboardPathForRole(user?.role) : '/login';
  const primaryLabel = isAuthenticated ? tHeader('goToDashboard') : t('loginCta');

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <div className={siteContainer('relative pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-32 lg:pt-32')}>
        <motion.div
          className="mx-auto w-full max-w-5xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-display text-5xl font-bold tracking-tight text-primary sm:text-6xl md:text-7xl lg:text-8xl">
            {t('brand')}
          </p>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
            {t('subtitle')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className={ctaButtonClass}>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/features">{t('exploreCta')}</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="mt-16 w-full sm:mt-20"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Feature grid ─── */

const FEATURE_KEYS = [
  { icon: BookOpen, key: 'lms' },
  { icon: GraduationCap, key: 'erp' },
  { icon: ClipboardCheck, key: 'exams' },
  { icon: Code2, key: 'codingLabs' },
  { icon: Terminal, key: 'cloudIDE' },
  { icon: Lightbulb, key: 'aiIdeation' },
  { icon: LineChart, key: 'analytics' },
  { icon: ShieldCheck, key: 'audit' },
] as const;

function FeatureGrid() {
  const t = useTranslations('marketing.landing.features');

  return (
    <MotionSection id="features" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
          {FEATURE_KEYS.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="card-interactive rounded-2xl border border-border bg-card p-6 shadow-soft-sm sm:p-7"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(`${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}

/* ─── Dashboard preview ─── */

function DashboardPreview() {
  const t = useTranslations('marketing.landing.dashboard');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  const sidebarItems = [
    tCommon('home'),
    tNav('courses'),
    tNav('calendar'),
    tNav('people'),
    tNav('reports'),
    tCommon('settings'),
  ] as const;

  const stats = [
    { label: t('activeCourses'), value: '128' },
    { label: t('openLabs'), value: '46' },
    { label: t('upcomingExams'), value: '12' },
  ] as const;

  const activities = [t('activity1'), t('activity2'), t('activity3')] as const;

  return (
    <MotionSection id="product" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg">
          <div className="grid lg:grid-cols-[minmax(0,13.75rem)_minmax(0,1fr)]">
            <aside className="hidden min-w-0 border-r border-border bg-muted/30 p-5 lg:block">
              <p className="font-display text-sm font-semibold text-foreground">
                {tCommon('appName')}
              </p>
              <nav className="mt-6 space-y-1">
                {sidebarItems.map((item, i) => (
                  <div
                    key={item}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item}
                  </div>
                ))}
              </nav>
            </aside>
            <div className="min-w-0 space-y-4 p-4 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {t('welcomeBack')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('institutionOverview')}</p>
                </div>
                <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  {tCommon('liveSync')}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="card-interactive rounded-2xl border border-border bg-background p-4 shadow-soft-sm">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="card-interactive rounded-2xl border border-border bg-background p-4 shadow-soft-sm">
                  <p className="text-sm font-medium text-foreground">{t('engagementTrend')}</p>
                  <div className="mt-4 flex h-28 items-end gap-2">
                    {[35, 48, 42, 70, 58, 82, 76].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-primary/70"
                        style={{ height: `${String(h)}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="card-interactive rounded-2xl border border-border bg-background p-4 shadow-soft-sm">
                  <p className="text-sm font-medium text-foreground">{t('recentActivity')}</p>
                  <ul className="mt-4 space-y-3">
                    {activities.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}

/* ─── Shared product section ─── */

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  icon: Icon,
  reverse,
  visual,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  reverse?: boolean;
  visual: ReactNode;
}) {
  return (
    <MotionSection id={id} className="scroll-mt-24 py-16 sm:py-20">
      <div className={siteContainer()}>
        <div
          className={cn(
            'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
            reverse && 'lg:[&>*:first-child]:order-2',
          )}
        >
          <div>
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <p className="mt-5 font-display text-sm font-semibold tracking-wide text-primary">{eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            <ul className="mt-6 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div>{visual}</div>
        </div>
      </div>
    </MotionSection>
  );
}

function MockPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'card-interactive rounded-2xl border border-border bg-card p-5 shadow-soft-md sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

function CodingLabsPreview() {
  const t = useTranslations('marketing.landing.codingLabs');

  return (
    <ProductSection
      id="coding-labs"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      icon={Code2}
      bullets={[t('bullet1'), t('bullet2'), t('bullet3')]}
      visual={
        <MockPanel>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-foreground">lab-04 · sorting</p>
            <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              {t('passingStatus')}
            </span>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground">
            {`def merge_sort(arr):\n  if len(arr) <= 1:\n    return arr\n  mid = len(arr) // 2\n  return merge(\n    merge_sort(arr[:mid]),\n    merge_sort(arr[mid:])\n  )`}
          </pre>
          <div className="mt-4 flex gap-2">
            <div className="h-8 flex-1 rounded-lg bg-primary/90" />
            <div className="h-8 w-20 rounded-lg border border-border bg-background" />
          </div>
        </MockPanel>
      }
    />
  );
}

function AiFeatures() {
  const t = useTranslations('marketing.landing.aiFeatures');

  return (
    <ProductSection
      id="ai"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      icon={Brain}
      reverse
      bullets={[t('bullet1'), t('bullet2'), t('bullet3')]}
      visual={
        <MockPanel>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <p className="font-display text-sm font-semibold">{t('ideationTitle')}</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
              {t('prompt')}
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
              <p className="font-medium">{t('response1Title')}</p>
              <p className="mt-1 text-muted-foreground">{t('response1Body')}</p>
            </div>
            <div className="card-interactive rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <p className="font-medium">{t('response2Title')}</p>
              <p className="mt-1 text-muted-foreground">{t('response2Body')}</p>
            </div>
          </div>
        </MockPanel>
      }
    />
  );
}

function PracticeLabs() {
  const t = useTranslations('marketing.landing.practiceLabs');

  const tracks = [
    { name: t('track1'), pct: 72 },
    { name: t('track2'), pct: 41 },
    { name: t('track3'), pct: 18 },
  ] as const;

  return (
    <ProductSection
      id="practice"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      icon={Terminal}
      bullets={[t('bullet1'), t('bullet2'), t('bullet3')]}
      visual={
        <MockPanel>
          <p className="font-display text-sm font-semibold text-foreground">{t('trackTitle')}</p>
          <div className="mt-4 space-y-3">
            {tracks.map((track) => (
              <div key={track.name} className="card-interactive rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{track.name}</span>
                  <span className="text-xs text-muted-foreground">{track.pct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-gradient"
                    style={{ width: `${String(track.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </MockPanel>
      }
    />
  );
}

function ExamsSection() {
  const t = useTranslations('marketing.landing.exams');

  const meta = [
    { label: t('duration'), value: t('durationValue') },
    { label: t('questions'), value: t('questionsValue') },
    { label: t('candidates'), value: t('candidatesValue') },
    { label: t('integrity'), value: t('integrityValue') },
  ] as const;

  return (
    <ProductSection
      id="exams"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      icon={ClipboardCheck}
      reverse
      bullets={[t('bullet1'), t('bullet2'), t('bullet3')]}
      visual={
        <MockPanel>
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-foreground">Midterm · CS301</p>
            <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              {t('windowOpen')}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {meta.map((item) => (
              <div key={item.label} className="card-interactive rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </MockPanel>
      }
    />
  );
}

function ProjectsSection() {
  const t = useTranslations('marketing.landing.projects');
  const columns = [
    { key: 'backlog', label: t('backlog'), cards: 2 },
    { key: 'inProgress', label: t('inProgress'), cards: 2 },
    { key: 'done', label: t('done'), cards: 1 },
  ] as const;

  return (
    <ProductSection
      id="projects"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      icon={FolderKanban}
      bullets={[t('bullet1'), t('bullet2'), t('bullet3')]}
      visual={
        <MockPanel>
          <p className="font-display text-sm font-semibold text-foreground">{t('boardTitle')}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {columns.map((col) => (
              <div key={col.key} className="rounded-xl bg-muted/50 p-2">
                <p className="mb-2 font-medium text-muted-foreground">{col.label}</p>
                <div className="space-y-2">
                  {Array.from({ length: col.cards }, (_, i) => (
                    <div key={i} className="h-12 rounded-lg border border-border bg-card" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </MockPanel>
      }
    />
  );
}

function AnalyticsSection() {
  const t = useTranslations('marketing.landing.analytics');

  const modules = [
    { name: t('module1'), pct: 86 },
    { name: t('module2'), pct: 74 },
    { name: t('module3'), pct: 61 },
  ] as const;

  return (
    <ProductSection
      id="analytics"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      icon={BarChart3}
      reverse
      bullets={[t('bullet1'), t('bullet2'), t('bullet3')]}
      visual={
        <MockPanel>
          <p className="font-display text-sm font-semibold text-foreground">{t('masteryTitle')}</p>
          <div className="mt-5 space-y-3">
            {modules.map((row) => (
              <div key={row.name}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{row.name}</span>
                  <span className="text-muted-foreground">{row.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${String(row.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </MockPanel>
      }
    />
  );
}

/* ─── Testimonials ─── */

function Testimonials() {
  const t = useTranslations('marketing.landing.testimonials');

  const items = [
    { quote: t('quote1'), name: t('name1'), role: t('role1') },
    { quote: t('quote2'), name: t('name2'), role: t('role2') },
    { quote: t('quote3'), name: t('name3'), role: t('role3') },
  ] as const;

  return (
    <MotionSection className="py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <blockquote
              key={item.name}
              className="card-interactive flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft-sm"
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-border pt-4">
                <cite className="not-italic">
                  <span className="block font-display text-sm font-semibold text-foreground">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.role}</span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}

/* ─── FAQ ─── */

function Faq() {
  const t = useTranslations('marketing.landing.faq');

  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
  ] as const;

  return (
    <MotionSection id="faq" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mx-auto mt-10 w-full max-w-5xl space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className="card-interactive group rounded-2xl border border-border bg-card px-5 py-1 shadow-soft-sm open:shadow-soft-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}

/* ─── Pricing ─── */

function Pricing() {
  const t = useTranslations('marketing.landing.pricing');

  const tiers = [
    {
      key: 'starter',
      name: t('starter.name'),
      price: t('starter.price'),
      description: t('starter.description'),
      features: [t('starter.feature1'), t('starter.feature2'), t('starter.feature3')],
      cta: t('starter.cta'),
      href: '/login' as const,
      highlighted: false,
    },
    {
      key: 'institution',
      name: t('institution.name'),
      price: t('institution.price'),
      description: t('institution.description'),
      features: [
        t('institution.feature1'),
        t('institution.feature2'),
        t('institution.feature3'),
        t('institution.feature4'),
      ],
      cta: t('institution.cta'),
      href: '/login' as const,
      highlighted: true,
    },
    {
      key: 'enterprise',
      name: t('enterprise.name'),
      price: t('enterprise.price'),
      description: t('enterprise.description'),
      features: [
        t('enterprise.feature1'),
        t('enterprise.feature2'),
        t('enterprise.feature3'),
        t('enterprise.feature4'),
      ],
      cta: t('enterprise.cta'),
      href: '/contact' as const,
      highlighted: false,
    },
  ] as const;

  return (
    <MotionSection id="pricing" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3 xl:gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={cn(
                'card-interactive flex flex-col rounded-2xl border bg-card p-6 shadow-soft-sm sm:p-8',
                tier.highlighted
                  ? 'border-primary shadow-soft-lg ring-1 ring-primary/30'
                  : 'border-border',
              )}
            >
              <h3 className="font-display text-lg font-semibold text-foreground">{tier.name}</h3>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{tier.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8 w-full"
                variant={tier.highlighted ? 'default' : 'outline'}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}

/* ─── Final CTA ─── */

function FinalCta() {
  const t = useTranslations('marketing.landing.finalCta');
  const tHeader = useTranslations('marketing.header');
  const { user, isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? dashboardPathForRole(user?.role) : '/login';
  const primaryLabel = isAuthenticated ? tHeader('goToDashboard') : t('cta');

  return (
    <MotionSection className="w-full pb-0 pt-8 sm:pb-28 sm:pt-10">
      <div className="w-full sm:px-[clamp(1rem,2.5vw,2.5rem)] xl:px-[clamp(1.5rem,3vw,3.5rem)]">
        <div className="relative overflow-hidden border-y border-border bg-gradient-to-br from-primary/15 via-background to-accent/10 px-[clamp(1rem,3vw,3.5rem)] py-16 text-center sm:rounded-2xl sm:border sm:py-20 sm:shadow-soft-lg lg:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.12),_transparent_65%)]"
          />
          <div className="relative mx-auto w-full max-w-4xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('title')}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl">
              {t('description')}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className={ctaButtonClass}>
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}

export function LandingPage() {
  return (
    <main className="w-full max-w-[100vw] overflow-x-clip font-body">
      <Hero />
      <FeatureGrid />
      <DashboardPreview />
      <CodingLabsPreview />
      <AiFeatures />
      <PracticeLabs />
      <ExamsSection />
      <ProjectsSection />
      <AnalyticsSection />
      <Testimonials />
      <Faq />
      <Pricing />
      <FinalCta />
    </main>
  );
}
