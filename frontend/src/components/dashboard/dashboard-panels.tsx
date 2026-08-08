'use client';

import { Button, Card, CardContent, StatusBadge } from '@learnova/ui';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export interface DashboardTaskItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
  meta?: string;
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden rounded-xl border-border/80 shadow-soft-md', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-section-title text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-caption">{description}</p> : null}
        </div>
        {action}
      </div>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function DashboardTaskList({
  items,
  emptyTitle,
  emptyDescription,
  icon: Icon,
}: {
  items: DashboardTaskItem[];
  emptyTitle: string;
  emptyDescription: string;
  icon?: LucideIcon;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        {Icon ? (
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </span>
        ) : null}
        <p className="text-label text-foreground">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-caption">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-label text-foreground group-hover:text-primary">
                {item.title}
              </p>
              {item.subtitle ? (
                <p className="mt-0.5 truncate text-caption">{item.subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.status ? <StatusBadge status={item.status} /> : null}
              {item.meta ? <span className="hidden text-caption sm:inline">{item.meta}</span> : null}
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DashboardQuickActions({
  actions,
}: {
  actions: { label: string; href: string; icon?: LucideIcon }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.href} asChild variant="outline" size="sm" className="rounded-xl">
          <Link href={action.href}>
            {action.icon ? <action.icon className="size-4" /> : null}
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
