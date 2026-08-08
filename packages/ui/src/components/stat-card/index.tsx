import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../card';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  action?: React.ReactNode;
  loading?: boolean;
  className?: string;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

const accentRing: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-muted text-muted-foreground',
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  action,
  loading,
  className,
  accent = 'primary',
}: StatCardProps) {
  return (
    <Card interactive className={cn('overflow-hidden', className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-label text-muted-foreground">{label}</p>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
            ) : (
              <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground transition-transform duration-300 group-hover:translate-x-0.5">
                {value}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {trend ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium',
                    trend.positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}
                >
                  {trend.value}
                </span>
              ) : null}
              {hint ? <span className="text-caption">{hint}</span> : null}
            </div>
          </div>
          {Icon ? (
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-glow',
                accentRing[accent],
              )}
            >
              <Icon className="size-5 transition-transform duration-300 group-hover:scale-105" aria-hidden />
            </span>
          ) : null}
        </div>
        {action ? <div className="mt-4 border-t border-border/60 pt-4">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
