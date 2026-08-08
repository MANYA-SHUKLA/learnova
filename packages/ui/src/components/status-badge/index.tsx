import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium capitalize',
  {
    variants: {
      variant: {
        draft: 'border-border bg-muted/60 text-muted-foreground',
        published: 'border-success/25 bg-success/10 text-success',
        archived: 'border-border bg-muted text-muted-foreground',
        pending: 'border-warning/30 bg-warning/10 text-warning',
        approved: 'border-success/25 bg-success/10 text-success',
        rejected: 'border-danger/25 bg-danger/10 text-danger',
        locked: 'border-primary/25 bg-primary/10 text-primary',
        completed: 'border-accent/25 bg-accent/10 text-accent',
        active: 'border-success/25 bg-success/10 text-success',
        inactive: 'border-border bg-muted text-muted-foreground',
        default: 'border-border bg-muted/50 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type StatusBadgeVariant = NonNullable<VariantProps<typeof statusBadgeVariants>['variant']>;

const STATUS_ALIASES: Record<string, StatusBadgeVariant> = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  locked: 'locked',
  completed: 'completed',
  active: 'active',
  inactive: 'inactive',
  open: 'active',
  closed: 'archived',
  submitted: 'pending',
  graded: 'approved',
  late: 'rejected',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  variant?: StatusBadgeVariant;
  dot?: boolean;
}

export function StatusBadge({ status, variant, dot = true, className, ...props }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');
  const resolved = variant ?? STATUS_ALIASES[normalized] ?? 'default';

  return (
    <span className={cn(statusBadgeVariants({ variant: resolved }), className)} {...props}>
      {dot ? (
        <span
          className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
          aria-hidden
        />
      ) : null}
      {status.replace(/_/g, ' ')}
    </span>
  );
}
