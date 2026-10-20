'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Marketing-only product mock — browser chrome, sidebar, and dashboard sample.
 * Used on the public home URL (/), not on campus or institution workspaces.
 */
export function MarketingProductPreview({ className }: { className?: string }) {
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
    <div className={cn('relative mx-auto w-full', className)} aria-hidden>
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl" />
      <div className="card-interactive relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-soft-lg backdrop-blur-sm">
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
                <div
                  key={n}
                  className="card-interactive min-w-0 rounded-xl border border-border bg-background p-2.5 shadow-soft-sm sm:p-3"
                >
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
