'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Separator } from '@learnova/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Layers3,
  School,
  Settings,
  Shield,
  UsersRound,
  BookOpen,
  Network,
  CalendarRange,
  Grid3X3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Link, usePathname } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

const SESSIONS_ROUTE = '/sessions';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: APP_ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: APP_ROUTES.INSTITUTION, label: 'Institution', icon: Building2, exact: true },
    ],
  },
  {
    label: 'Academics',
    items: [
      { href: APP_ROUTES.INSTITUTION_CAMPUSES, label: 'Campuses', icon: School },
      { href: APP_ROUTES.INSTITUTION_SCHOOLS, label: 'Schools', icon: GraduationCap },
      { href: APP_ROUTES.INSTITUTION_DEPARTMENTS, label: 'Departments', icon: Network },
      { href: APP_ROUTES.INSTITUTION_PROGRAMS, label: 'Programs', icon: BookOpen },
      { href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS, label: 'Academic Years', icon: CalendarRange },
      { href: APP_ROUTES.INSTITUTION_SEMESTERS, label: 'Semesters', icon: Layers3 },
      { href: APP_ROUTES.INSTITUTION_SECTIONS, label: 'Sections', icon: Grid3X3 },
      { href: APP_ROUTES.INSTITUTION_BATCHES, label: 'Batches', icon: UsersRound },
      { href: APP_ROUTES.INSTITUTION_CALENDAR, label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'System',
    items: [
      { href: APP_ROUTES.INSTITUTION_SETTINGS, label: 'Settings', icon: Settings },
      { href: SESSIONS_ROUTE, label: 'Sessions', icon: Shield },
    ],
  },
];

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname.endsWith(href);
  }
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.endsWith(href);
}

function formatRole(role?: string | null) {
  if (!role) return 'Member';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1.5">
          {!collapsed ? (
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
          ) : (
            <Separator className="mx-1 my-1 opacity-60" />
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-accent font-medium text-sidebar-primary shadow-soft-sm'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0',
                        active ? 'text-sidebar-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const email = user?.email ?? 'Signed out';
  const role = formatRole(user?.role);

  return (
    <div className="border-t border-sidebar-border p-3">
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5',
          collapsed && 'justify-center',
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {(user ? (user.firstName[0] ?? user.email[0] ?? 'L') : 'L').toUpperCase()}
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{email}</p>
            <p className="truncate text-xs text-muted-foreground">{role}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DesktopSidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? '4.5rem' : 'min(17rem, 100%)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="sticky top-0 z-30 hidden h-svh w-[min(17rem,100%)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-sidebar-border px-3',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}
      >
        <Logo collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
            collapsed && 'absolute right-[-12px] top-5 z-10 border border-border bg-background shadow-soft-sm',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </motion.aside>
  );
}

function MobileDrawer() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, setMobileNavOpen]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => {
              setMobileNavOpen(false);
            }}
            aria-hidden
          />
          <motion.aside
            key="drawer"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw-2.5rem,18rem)] max-w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-soft-lg lg:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Logo />
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                }}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                aria-label="Close navigation"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>
            <SidebarNav
              collapsed={false}
              onNavigate={() => {
                setMobileNavOpen(false);
              }}
            />
            <SidebarFooter collapsed={false} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function AppSidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileDrawer />
    </>
  );
}
