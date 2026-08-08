'use client';

import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import type { ReactNode } from 'react';
import { EmptyState, ErrorState } from '@/features/institution';

export function CertificatePageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function certificateStatusVariant(
  status: string,
): 'default' | 'secondary' | 'danger' | 'outline' {
  if (status === 'published' || status === 'issued') return 'default';
  if (status === 'revoked') return 'danger';
  if (status === 'draft' || status === 'generated') return 'secondary';
  return 'outline';
}

export function CertificateStatGrid({
  loading,
  children,
  columns = 4,
}: {
  loading?: boolean;
  children: ReactNode;
  columns?: 2 | 4;
}) {
  const gridClass =
    columns === 2 ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return <div className={gridClass}>{children}</div>;
}

export function CertificateStatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-soft-sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function CertificateListCard({
  title,
  description,
  icon,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-soft-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {isError && errorMessage && onRetry ? (
        <div className="px-6 pb-6">
          <ErrorState message={errorMessage} onRetry={onRetry} />
        </div>
      ) : isLoading ? (
        <div className="space-y-3 px-6 pb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : !children && emptyTitle ? (
        <div className="px-6 pb-6">
          <EmptyState title={emptyTitle} description={emptyDescription ?? ''} />
        </div>
      ) : (
        <div className="divide-y divide-border px-6 pb-6">{children}</div>
      )}
    </Card>
  );
}

export function CertificateListRow({
  primary,
  secondary,
  status,
}: {
  primary: string;
  secondary?: string;
  status: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">{primary}</p>
        {secondary ? <p className="text-xs text-muted-foreground">{secondary}</p> : null}
      </div>
      <Badge variant={certificateStatusVariant(status)}>{status}</Badge>
    </div>
  );
}
