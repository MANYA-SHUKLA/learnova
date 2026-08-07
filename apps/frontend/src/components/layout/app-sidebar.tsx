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
  Users,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link, usePathname } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

const SESSIONS_ROUTE = '/sessions';

type SidebarGroupId = 'institution' | 'academics' | 'peopleAndLearning' | 'system' | 'facultyHome' | 'studentHome';
type SidebarItemId =
  | 'dashboard'
  | 'institution'
  | 'departments'
  | 'programs'
  | 'academicYears'
  | 'semesters'
  | 'settings'
  | 'campuses'
  | 'schools'
  | 'sections'
  | 'batches'
  | 'calendar'
  | 'faculty'
  | 'students'
  | 'courses'
  | 'sessions'
  | 'profile';

interface NavItem {
  id: SidebarItemId;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  comingSoon?: boolean;
}

interface NavGroup {
  id: SidebarGroupId;
  items: NavItem[];
}

// Institution admin navigation
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'institution',
    items: [
      { id: 'dashboard', href: APP_ROUTES.INSTITUTION_DASHBOARD, icon: LayoutDashboard, exact: true },
      { id: 'institution', href: APP_ROUTES.INSTITUTION, icon: Building2, exact: true },
      { id: 'departments', href: APP_ROUTES.INSTITUTION_DEPARTMENTS, icon: Network },
      { id: 'programs', href: APP_ROUTES.INSTITUTION_PROGRAMS, icon: BookOpen },
      { id: 'academicYears', href: APP_ROUTES.INSTITUTION_ACADEMIC_YEARS, icon: CalendarRange },
      { id: 'semesters', href: APP_ROUTES.INSTITUTION_SEMESTERS, icon: Layers3 },
      { id: 'settings', href: APP_ROUTES.INSTITUTION_SETTINGS, icon: Settings },
    ],
  },
  {
    id: 'academics',
    items: [
      { id: 'campuses', href: APP_ROUTES.INSTITUTION_CAMPUSES, icon: School },
      { id: 'schools', href: APP_ROUTES.INSTITUTION_SCHOOLS, icon: GraduationCap },
      { id: 'sections', href: APP_ROUTES.INSTITUTION_SECTIONS, icon: Grid3X3 },
      { id: 'batches', href: APP_ROUTES.INSTITUTION_BATCHES, icon: UsersRound },
      { id: 'calendar', href: APP_ROUTES.INSTITUTION_CALENDAR, icon: CalendarDays },
    ],
  },
  {
    id: 'peopleAndLearning',
    items: [
      { id: 'faculty', href: APP_ROUTES.INSTITUTION_FACULTY, icon: UserRound },
      { id: 'students', href: APP_ROUTES.INSTITUTION_STUDENTS, icon: Users },
      { id: 'courses', href: APP_ROUTES.INSTITUTION_COURSES, icon: BookOpen },
    ],
  },
  {
    id: 'system',
    items: [{ id: 'sessions', href: SESSIONS_ROUTE, icon: Shield }],
  },
];

// Faculty navigation
const FACULTY_NAV_GROUPS: NavGroup[] = [
  {
    id: 'facultyHome',
    items: [
      { id: 'dashboard', href: APP_ROUTES.FACULTY_DASHBOARD, icon: LayoutDashboard, exact: true },
      { id: 'students', href: APP_ROUTES.INSTITUTION_STUDENTS, icon: Users },
      { id: 'profile', href: APP_ROUTES.FACULTY_PROFILE, icon: UserRound },
      { id: 'sessions', href: SESSIONS_ROUTE, icon: Shield },
    ],
  },
];

// Student navigation
const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    id: 'studentHome',
    items: [
      { id: 'dashboard', href: APP_ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard, exact: true },
      { id: 'profile', href: APP_ROUTES.STUDENT_PROFILE, icon: UserRound },
      { id: 'sessions', href: SESSIONS_ROUTE, icon: Shield },
    ],
  },
];

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname.endsWith(href);
  }
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.endsWith(href);
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('dashboard.sidebar');
  const { user } = useAuth();
  
  // Select navigation groups based on user role
  const navGroups = 
    user?.role === 'faculty' ? FACULTY_NAV_GROUPS :
    user?.role === 'student' ? STUDENT_NAV_GROUPS :
    NAV_GROUPS; // default to institution admin

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {navGroups.map((group) => {
        const groupLabel = t(`groups.${group.id}`);
        return (
          <div key={group.id} className="space-y-1.5">
            {!collapsed ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {groupLabel}
              </p>
            ) : (
              <Separator className="mx-1 my-1 opacity-60" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const label = t(`items.${item.id}`);
                const active = !item.comingSoon && isNavActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                if (item.comingSoon) {
                  return (
                    <li key={item.id}>
                      <span
                        title={collapsed ? `${label} (${t('comingSoon')})` : undefined}
                        className={cn(
                          'flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-muted-foreground/70',
                          collapsed && 'justify-center px-2',
                        )}
                      >
                        <Icon className="size-4 shrink-0 opacity-60" />
                        {!collapsed ? (
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                            <span className="truncate">{label}</span>
                            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('comingSoon')}
                            </span>
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? label : undefined}
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
                      {!collapsed ? <span className="truncate">{label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const email = user?.email ?? tCommon('account');
  const roleKey = user?.role;
  const role =
    roleKey && tRoles.has(roleKey)
      ? tRoles(roleKey as 'student' | 'faculty' | 'institution_admin')
      : roleKey
        ? roleKey
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : tCommon('account');

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
  const tCommon = useTranslations('common');

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 272 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="sticky top-0 z-30 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
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
          aria-label={collapsed ? tCommon('openNav') : tCommon('closeNav')}
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
  const tCommon = useTranslations('common');

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
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] lg:hidden"
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
                aria-label={tCommon('closeNav')}
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
