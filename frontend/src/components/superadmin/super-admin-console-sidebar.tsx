'use client';

import { Badge } from '@learnova/ui';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type SuperAdminConsoleTab = 'requests' | 'campuses' | 'adminLogins';

interface NavItem {
  id: SuperAdminConsoleTab;
  icon: LucideIcon;
  badge?: number;
}

interface SuperAdminConsoleSidebarProps {
  activeTab: SuperAdminConsoleTab;
  onTabChange: (tab: SuperAdminConsoleTab) => void;
  navItems: NavItem[];
  pendingCount: number;
  campusCount: number;
  className?: string;
}

export function SuperAdminConsoleSidebar({
  activeTab,
  onTabChange,
  navItems,
  pendingCount,
  campusCount,
  className,
}: SuperAdminConsoleSidebarProps) {
  const t = useTranslations('superadmin.console');

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-full flex-col border-border bg-sidebar text-sidebar-foreground lg:w-[280px] lg:shrink-0 lg:border-r',
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-5">
        <p className="font-display text-lg font-semibold text-sidebar-foreground">{t('sidebarTitle')}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={t('tabsLabel')}>
        {navItems.map(({ id, icon: Icon, badge }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent font-medium text-sidebar-primary shadow-soft-sm'
                  : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
              )}
            >
              {active ? (
                <span
                  className="absolute inset-y-2 left-0 w-1 rounded-full bg-sidebar-primary"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={cn('size-4 shrink-0', active ? 'text-sidebar-primary' : 'text-muted-foreground')}
                aria-hidden
              />
              <span className="flex-1 truncate">{t(`tabs.${id}`)}</span>
              {badge != null && badge > 0 ? (
                <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                  {badge}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-sidebar-accent/60 px-2 py-3">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{pendingCount}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{t('statPending')}</p>
          </div>
          <div className="rounded-xl bg-sidebar-accent/60 px-2 py-3">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{campusCount}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{t('statCampuses')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
