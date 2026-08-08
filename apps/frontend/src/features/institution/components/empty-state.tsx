'use client';

import { Button, Card, CardContent } from '@learnova/ui';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  EmptyIllustration,
  type IllustrationVariant,
} from './illustrations';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: IllustrationVariant;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  action,
  illustration = 'inbox',
  icon: Icon,
}: EmptyStateProps) {
  return (
    <Card className="overflow-hidden border-dashed border-border/80">
      <CardContent className="flex flex-col items-center justify-center gap-5 py-14 text-center sm:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {Icon ? (
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft-sm">
              <Icon className="size-8" aria-hidden />
            </div>
          ) : (
            <EmptyIllustration variant={illustration} />
          )}
        </motion.div>
        <div className="space-y-2">
          <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
          {description ? (
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="mt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useTranslations('common');
  return (
    <Card className="border-danger/20 bg-danger/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
        <p className="text-sm text-danger">{message}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('retry')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
