'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Badge, Skeleton } from '@learnova/ui';
import { CalendarRange } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrentAcademicSession } from '@/features/institution';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

interface AcademicSessionChipProps {
  className?: string;
  compact?: boolean;
}

export function AcademicSessionChip({ className, compact }: AcademicSessionChipProps) {
  const t = useTranslations('dashboard.institution.session');
  const { enabled, isLoading, label, needsSetup, needsSemester } = useCurrentAcademicSession();

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Skeleton
        className={cn('h-7 rounded-full', compact ? 'w-32' : 'w-44', className)}
        aria-hidden
      />
    );
  }

  if (needsSetup) {
    return (
      <Link
        href={APP_ROUTES.INSTITUTION_ACADEMIC_YEARS}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-100',
          className,
        )}
      >
        <CalendarRange className="size-3.5 shrink-0" />
        <span className="truncate">{t('notConfigured')}</span>
      </Link>
    );
  }

  if (needsSemester) {
    return (
      <Link
        href={APP_ROUTES.INSTITUTION_SEMESTERS}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-100',
          className,
        )}
      >
        <CalendarRange className="size-3.5 shrink-0" />
        <span className="truncate">{t('noSemester')}</span>
      </Link>
    );
  }

  if (!label) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'max-w-full gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-normal text-foreground',
        className,
      )}
      title={t('currentLabel')}
    >
      <CalendarRange className="size-3.5 shrink-0 text-primary" aria-hidden />
      <span className="truncate text-xs font-medium">{label}</span>
    </Badge>
  );
}
