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
import type { ReactNode } from 'react';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
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
            {['Overview', 'Courses', 'Labs', 'Exams', 'Analytics'].map((item, i) => (
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
              {['Overview', 'Courses', 'Labs', 'Exams'].map((item, i) => (
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
                <div key={n} className="min-w-0 rounded-xl border border-border bg-background p-2.5 shadow-soft-sm sm:p-3">
                  <div className="h-2 w-8 max-w-full rounded bg-muted sm:w-10" />
                  <p className="mt-2 font-display text-base font-semibold text-foreground sm:text-xl">{n}%</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
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
            Learnova
          </p>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            Learn. Build. Excel.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
            The enterprise AI learning platform that unifies LMS, exams, coding labs, and analytics
            for modern institutions.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="min-w-[10.5rem] px-9 shadow-soft-lg">
              <Link href="/login">Get started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[10.5rem] border-border/70 bg-card/80 px-9 backdrop-blur-sm"
            >
              <Link href="/about">Learn more</Link>
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

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BookOpen,
    title: 'LMS',
    description: 'Courses, cohorts, and content delivery built for institutional scale.',
  },
  {
    icon: GraduationCap,
    title: 'ERP',
    description: 'Programs, campuses, batches, and academic structure in one place.',
  },
  {
    icon: ClipboardCheck,
    title: 'Exams',
    description: 'Secure assessment workflows with scheduling, proctoring hooks, and results.',
  },
  {
    icon: Code2,
    title: 'Coding Labs',
    description: 'Hands-on practice environments with real-time feedback for every learner.',
  },
  {
    icon: Terminal,
    title: 'Cloud IDE',
    description: 'Browser-native development workspaces ready for assignments and projects.',
  },
  {
    icon: Lightbulb,
    title: 'AI Ideation',
    description: 'Guided brainstorming and concept exploration powered by institutional AI.',
  },
  {
    icon: LineChart,
    title: 'Analytics',
    description: 'Live insights across engagement, mastery, and institutional outcomes.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit',
    description: 'Complete activity trails for compliance, governance, and peace of mind.',
  },
];

function FeatureGrid() {
  return (
    <MotionSection id="features" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow="Platform"
          title="Everything your institution needs"
          description="Eight modules that work together — from curriculum delivery to secure exams and AI-assisted learning."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft-sm transition-shadow hover:shadow-soft-md sm:p-7"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}

/* ─── Dashboard preview ─── */

function DashboardPreview() {
  return (
    <MotionSection id="product" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow="Dashboard"
          title="A command center for learning ops"
          description="Faculty, admins, and learners share one coherent workspace — without the clutter."
        />
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg">
          <div className="grid lg:grid-cols-[minmax(0,13.75rem)_minmax(0,1fr)]">
            <aside className="hidden min-w-0 border-r border-border bg-muted/30 p-5 lg:block">
              <p className="font-display text-sm font-semibold text-foreground">Learnova</p>
              <nav className="mt-6 space-y-1">
                {['Home', 'Courses', 'Calendar', 'People', 'Reports', 'Settings'].map((item, i) => (
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
                  <h3 className="font-display text-xl font-semibold text-foreground">Welcome back</h3>
                  <p className="text-sm text-muted-foreground">Institution overview · this week</p>
                </div>
                <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  Live sync
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Active courses', value: '128' },
                  { label: 'Open labs', value: '46' },
                  { label: 'Upcoming exams', value: '12' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-background p-4 shadow-soft-sm">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4 shadow-soft-sm">
                  <p className="text-sm font-medium text-foreground">Engagement trend</p>
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
                <div className="rounded-2xl border border-border bg-background p-4 shadow-soft-sm">
                  <p className="text-sm font-medium text-foreground">Recent activity</p>
                  <ul className="mt-4 space-y-3">
                    {['Batch A submitted Lab 04', 'Exam window opened', 'New course published'].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      ),
                    )}
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
        'rounded-2xl border border-border bg-card p-5 shadow-soft-lg sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

function CodingLabsPreview() {
  return (
    <ProductSection
      id="coding-labs"
      eyebrow="Coding Labs"
      title="Practice that feels like production"
      description="Scaffolded challenges, auto-graded submissions, and a cloud IDE your students can open in one click."
      icon={Code2}
      bullets={[
        'Language packs for popular stacks',
        'Instant feedback on test suites',
        'Faculty templates and rubrics',
      ]}
      visual={
        <MockPanel>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-foreground">lab-04 · sorting</p>
            <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              Passing
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
  return (
    <ProductSection
      id="ai"
      eyebrow="AI Features"
      title="Ideation that accelerates learning"
      description="Help students explore concepts, outline projects, and get structured guidance — with faculty-controlled guardrails."
      icon={Brain}
      reverse
      bullets={[
        'Prompted brainstorming sessions',
        'Institution-scoped knowledge',
        'Transparent, auditable AI usage',
      ]}
      visual={
        <MockPanel>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <p className="font-display text-sm font-semibold">AI Ideation</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
              Suggest three project ideas for distributed systems…
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
              <p className="font-medium">1. Consensus simulator</p>
              <p className="mt-1 text-muted-foreground">
                Model Raft under network partitions with live visuals.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
              <p className="font-medium">2. Edge cache playground</p>
              <p className="mt-1 text-muted-foreground">Compare TTL strategies across regions.</p>
            </div>
          </div>
        </MockPanel>
      }
    />
  );
}

function PracticeLabs() {
  return (
    <ProductSection
      id="practice"
      eyebrow="Practice Labs"
      title="Repetition that builds mastery"
      description="Guided drills and progressive difficulty keep learners in flow — from first concept to interview-ready skill."
      icon={Terminal}
      bullets={[
        'Skill tracks mapped to curricula',
        'Streaks and progress milestones',
        'Peer comparison without pressure',
      ]}
      visual={
        <MockPanel>
          <p className="font-display text-sm font-semibold text-foreground">Practice track</p>
          <div className="mt-4 space-y-3">
            {(
              [
                { name: 'Arrays & hashing', pct: 72 },
                { name: 'Graphs', pct: 41 },
                { name: 'System design basics', pct: 18 },
              ] as const
            ).map((track) => (
              <div key={track.name} className="rounded-xl border border-border bg-background p-3">
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
  return (
    <ProductSection
      id="exams"
      eyebrow="Exams"
      title="Assessment you can trust"
      description="Schedule windows, question banks, and result pipelines designed for high-stakes institutional exams."
      icon={ClipboardCheck}
      reverse
      bullets={[
        'Timed sections and question pools',
        'Role-based exam administration',
        'Exportable results and audit trails',
      ]}
      visual={
        <MockPanel>
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-foreground">Midterm · CS301</p>
            <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              Window open
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Duration', value: '90 min' },
              { label: 'Questions', value: '40' },
              { label: 'Candidates', value: '312' },
              { label: 'Integrity', value: 'On' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-background p-3">
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
  return (
    <ProductSection
      id="projects"
      eyebrow="Projects"
      title="From assignment to portfolio"
      description="Team projects with milestones, reviews, and submission workflows that mirror real product work."
      icon={FolderKanban}
      bullets={[
        'Milestones and peer reviews',
        'Repo-linked submissions',
        'Faculty feedback loops',
      ]}
      visual={
        <MockPanel>
          <p className="font-display text-sm font-semibold text-foreground">Capstone board</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {['Backlog', 'In progress', 'Done'].map((col) => (
              <div key={col} className="rounded-xl bg-muted/50 p-2">
                <p className="mb-2 font-medium text-muted-foreground">{col}</p>
                <div className="space-y-2">
                  <div className="h-12 rounded-lg border border-border bg-card" />
                  {col !== 'Done' ? <div className="h-12 rounded-lg border border-border bg-card" /> : null}
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
  return (
    <ProductSection
      id="analytics"
      eyebrow="Analytics"
      title="Outcomes you can act on"
      description="See where cohorts struggle, which labs drive mastery, and how interventions move the needle."
      icon={BarChart3}
      reverse
      bullets={[
        'Cohort and course heatmaps',
        'At-risk learner signals',
        'Export-ready institutional reports',
      ]}
      visual={
        <MockPanel>
          <p className="font-display text-sm font-semibold text-foreground">Mastery by module</p>
          <div className="mt-5 space-y-3">
            {[
              { name: 'Algorithms', pct: 86 },
              { name: 'Databases', pct: 74 },
              { name: 'Networks', pct: 61 },
            ].map((row) => (
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

const TESTIMONIALS = [
  {
    quote:
      'Learnova replaced three tools for us. Faculty actually use the dashboard — that alone was worth it.',
    name: 'Dr. Ananya Rao',
    role: 'Dean of Engineering, Northbridge University',
  },
  {
    quote:
      'Coding labs and exams in one place cut our ops overhead dramatically. Students feel the polish.',
    name: 'Marcus Chen',
    role: 'Director of Digital Learning, Helix Institute',
  },
  {
    quote:
      'The analytics finally show us where cohorts stall — interventions are faster and more targeted.',
    name: 'Priya Nair',
    role: 'VP Academic Affairs, Summit College',
  },
] as const;

function Testimonials() {
  return (
    <MotionSection className="py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow="Testimonials"
          title="Trusted by academic leaders"
          description="Placeholder voices from institutions evaluating Learnova for their next learning stack."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft-sm"
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-border pt-4">
                <cite className="not-italic">
                  <span className="block font-display text-sm font-semibold text-foreground">
                    {t.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t.role}</span>
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

const FAQS = [
  {
    q: 'Who is Learnova for?',
    a: 'Universities, colleges, and training institutes that need LMS, exams, coding practice, and analytics in a single enterprise platform.',
  },
  {
    q: 'Can we roll out module by module?',
    a: 'Yes. Start with LMS or Coding Labs and expand into exams, IDE, and analytics as your teams are ready.',
  },
  {
    q: 'Does Learnova support institutional SSO?',
    a: 'Enterprise plans are designed for SSO and role-based access across campuses, departments, and programs.',
  },
  {
    q: 'Is there a sandbox for evaluation?',
    a: 'Contact us for a guided demo environment. Starter accounts can explore core flows without a payment commitment.',
  },
  {
    q: 'How is AI usage governed?',
    a: 'AI features respect institution policies, with audit trails and faculty-configurable guardrails for student-facing tools.',
  },
] as const;

function Faq() {
  return (
    <MotionSection id="faq" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow="FAQ"
          title="Answers before you dive in"
          description="A short list of the questions institutions ask most often."
        />
        <div className="mx-auto mt-10 w-full max-w-5xl space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-card px-5 py-1 shadow-soft-sm open:shadow-soft-md"
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

const TIERS = [
  {
    name: 'Starter',
    price: 'Free to explore',
    description: 'Evaluate core LMS and lab flows with a small cohort.',
    features: ['Up to 50 learners', 'LMS + Coding Labs', 'Community support'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Institution',
    price: 'Custom',
    description: 'Full academic stack for campuses and departments.',
    features: ['Unlimited programs', 'Exams + Analytics', 'SSO-ready roles', 'Priority support'],
    cta: 'Talk to us',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Multi-campus governance, audit, and dedicated success.',
    features: ['Multi-tenant control', 'Advanced audit', 'SLA & onboarding', 'Custom integrations'],
    cta: 'Contact sales',
    highlighted: false,
  },
] as const;

function Pricing() {
  return (
    <MotionSection id="pricing" className="scroll-mt-24 py-20 sm:py-24">
      <div className={siteContainer()}>
        <SectionHeading
          eyebrow="Pricing"
          title="Plans that scale with you"
          description="Placeholder tiers for planning — no payment required. Choose the shape that fits your institution."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3 xl:gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'flex flex-col rounded-2xl border bg-card p-6 shadow-soft-sm sm:p-8',
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
                <Link href="/login">{tier.cta}</Link>
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
              Ready to modernize learning?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl">
              Bring LMS, exams, coding labs, and AI into one premium experience for your institution.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className="min-w-[10.5rem] px-9 shadow-soft-lg">
                <Link href="/login">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-w-[10.5rem] border-border/70 bg-card/80 px-9 backdrop-blur-sm"
              >
                <Link href="/about">About Learnova</Link>
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
