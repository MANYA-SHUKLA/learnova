'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/** Conceptual campus overview — replace with a real Learnova screenshot when available. */
export function PlatformDashboardPreview({ className }: { className?: string }) {
  const t = useTranslations('marketing.platformHome.dashboardPreview');

  return (
    <div
      className={cn(
        'card-interactive overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-soft-lg',
        'dark:border-white/10 dark:bg-[#243047]',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3 dark:border-white/10">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#64748B] dark:text-[#94a3b8]">
            {t('eyebrow')}
          </p>
          <p className="text-sm font-semibold text-[#14243A] dark:text-[#e2e8f0]">{t('title')}</p>
        </div>
        <span className="rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-medium text-[#16856B] dark:bg-[#16856B]/20 dark:text-[#6ee7b7]">
          {t('sampleBadge')}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 bg-[#F5F7FA] p-4 dark:bg-[#1e2a3c]">
        {(
          [
            ['statCourses', '24'],
            ['statAssignments', '86'],
            ['statAssessments', '12'],
          ] as const
        ).map(([key, value]) => (
          <div
            key={key}
            className="card-static rounded-lg border border-[#E2E8F0] bg-white p-3 dark:border-white/10 dark:bg-[#2a3850]"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94a3b8]">
              {t(key)}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-[#14243A] dark:text-[#f1f5f9]">{value}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E2E8F0] p-4 dark:border-white/10">
        <p className="text-xs font-medium text-[#14243A] dark:text-[#e2e8f0]">{t('activityTitle')}</p>
        <div className="mt-3 flex h-28 items-end gap-2">
          {[40, 62, 48, 78, 55, 70, 64].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-primary/80 dark:bg-primary/85"
              style={{ height: `${h}%` }}
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#64748B] dark:text-[#94a3b8]">{t('disclaimer')}</p>
      </div>
    </div>
  );
}
