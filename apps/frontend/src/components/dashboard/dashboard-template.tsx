'use client';

/**
 * Dashboard template primitives — reference: institution/dashboard/page.tsx
 *
 * Layout rhythm uses `.page-shell` (32px vertical gap) from @learnova/ui globals.
 * Pair with PageHeader, StatGrid/StatCard from @learnova/ui for full page structure.
 */

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { motion, type MotionProps } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

/** Shared motion — subtle enter, respects reduced motion via Framer */
export const dashboardFadeUp: MotionProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

/** Recharts palette aligned to design tokens */
export const DASHBOARD_CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary-hover))',
  'hsl(var(--accent))',
  'hsl(199 89% 48%)',
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
] as const;

export const DASHBOARD_CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--popover))',
    color: 'hsl(var(--popover-foreground))',
    boxShadow: 'var(--shadow-md)',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))' },
  itemStyle: { color: 'hsl(var(--popover-foreground))' },
} as const;

/** Standard page wrapper — 8px grid vertical rhythm */
export function DashboardPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('page-shell space-y-8', className)}>{children}</div>;
}

/** Section block below the fold — title, optional description, optional action */
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-section-title text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-caption">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Two-column analytics layout used on institution dashboard */
export function DashboardAnalyticsGrid({
  main,
  aside,
  className,
}: {
  main: ReactNode;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('dashboard-analytics-grid grid gap-6', className)}>
      <div className="min-w-0">{main}</div>
      <div className="space-y-6">{aside}</div>
    </div>
  );
}

/** Standard elevated panel card */
export function DashboardPanelCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn('h-full min-w-0 rounded-xl border-border/80 shadow-soft-md', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-card-title">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn('pt-2', contentClassName)}>{children}</CardContent>
    </Card>
  );
}

/** Hero strip with gradient — institution profile, role welcome, etc. */
export function DashboardHeroCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden rounded-xl border-border/80 shadow-soft-lg', className)}>
      <div className="relative bg-hero">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 20%, hsl(var(--primary) / 0.18), transparent 42%), radial-gradient(circle at 88% 10%, hsl(var(--accent) / 0.14), transparent 38%)',
          }}
        />
        <CardContent className="relative p-5 sm:p-7">{children}</CardContent>
      </div>
    </Card>
  );
}

/** Inline metric with progress bar */
export function DashboardProgressMetric({
  label,
  value,
  hint,
  percent,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  percent: number;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-primary" aria-hidden /> : null}
          <p className="text-label text-foreground">{label}</p>
        </div>
        <p className="font-display text-lg font-semibold tabular-nums tracking-tight">{value}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-brand-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {hint ? <p className="mt-2 text-caption">{hint}</p> : null}
    </div>
  );
}

/** Plan capacity / quota meter — institution hero sidebar */
export function DashboardCapacityMetric({
  label,
  value,
  hint,
  percent = 100,
}: {
  label: string;
  value: number;
  hint?: string;
  /** Visual fill; defaults to full bar for plan limits display */
  percent?: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/75 p-4 backdrop-blur-sm">
      <p className="text-meta">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </p>
      {hint ? <p className="mt-0.5 text-caption">{hint}</p> : null}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-brand-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/** Quick action tile grid — institution dashboard pattern */
export function DashboardQuickActionGrid({
  actions,
}: {
  actions: Array<{
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
  }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href} className="group block h-full">
            <Card interactive className="h-full rounded-xl border-border/80">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-label text-foreground">{action.title}</p>
                  <p className="mt-0.5 text-caption">{action.description}</p>
                </div>
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  aria-hidden
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/** List row inside insight panels */
export function DashboardInsightRow({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50">
      <p className="text-label text-foreground">{title}</p>
      {subtitle ? <p className="mt-0.5 text-caption">{subtitle}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }

  return body;
}

/** Empty placeholder inside panels */
export function DashboardPanelEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-caption">
      {message}
    </p>
  );
}

/** Ghost link action for panel headers */
export function DashboardPanelLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="ghost" size="sm" className="rounded-xl shrink-0">
      <Link href={href}>{label}</Link>
    </Button>
  );
}
