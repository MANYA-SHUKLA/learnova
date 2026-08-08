'use client';

import { Badge, Button } from '@learnova/ui';
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Shield,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useLogoutMutation } from '@/features/auth';
import { Link, usePathname, useRouter } from '@/lib/i18n/routing';
import { siteGutter } from '@/lib/layout';
import { useAuth } from '@/providers/auth-provider';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { CommandPaletteTrigger } from './command-palette';

const SESSIONS_ROUTE = '/sessions';

const SEGMENT_KEYS: Record<string, string> = {
  dashboard: 'dashboard',
  institution: 'institution',
  campuses: 'campuses',
  schools: 'schools',
  departments: 'departments',
  programs: 'programs',
  'academic-years': 'academicYears',
  semesters: 'semesters',
  sections: 'sections',
  batches: 'batches',
  calendar: 'calendar',
  settings: 'settings',
  sessions: 'sessions',
  faculty: 'faculty',
  students: 'students',
  courses: 'courses',
};

function useBreadcrumbs(pathname: string) {
  const tItems = useTranslations('dashboard.sidebar.items');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  return useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: { href: string; label: string }[] = [];
    let acc = '';
    for (const part of parts) {
      acc += `/${part}`;
      let label: string;
      if (part === 'profile') {
        label = tCommon('profile');
      } else if (SEGMENT_KEYS[part]) {
        label = tItems(SEGMENT_KEYS[part] as 'dashboard');
      } else if (tNav.has(part)) {
        label = tNav(part as 'dashboard');
      } else {
        label = part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      crumbs.push({ href: acc, label });
    }
    return crumbs;
  }, [pathname, tItems, tCommon, tNav]);
}

export function AppTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('dashboard.topbar');
  const tCommon = useTranslations('common');
  const tItems = useTranslations('dashboard.sidebar.items');
  const { user, signOut } = useAuth();
  const logoutMutation = useLogoutMutation();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const breadcrumbs = useBreadcrumbs(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    try {
      await logoutMutation.mutateAsync();
    } catch {
      await signOut();
    }
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-20 w-full min-w-0 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className={cn('flex h-14 min-w-0 items-center gap-2 sm:h-16 sm:gap-3', siteGutter)}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label={tCommon('openNav')}
          onClick={() => {
            setMobileNavOpen(true);
          }}
        >
          <Menu />
        </Button>

        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 flex-1 items-center gap-1 overflow-hidden md:flex"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={crumb.href} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" />
                ) : null}
                {isLast ? (
                  <span className="truncate text-sm font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="max-w-[8rem] truncate text-sm text-muted-foreground transition-colors hover:text-foreground xl:max-w-[12rem]"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-1.5">
          <CommandPaletteTrigger className="hidden shrink lg:flex" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label={tCommon('search')}
            onClick={() => { setCommandPaletteOpen(true); }}
          >
            <Search />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t('notifications')}
          >
            <Bell />
            <Badge
              variant="danger"
              className="absolute right-1.5 top-1.5 size-2 rounded-full border-0 p-0"
              aria-hidden
            />
          </Button>

          <LanguageToggle />

          <ThemeToggle />

          <div className="relative" ref={profileRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={t('profile')}
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((v) => !v);
              }}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {(user ? (user.firstName[0] ?? user.email[0] ?? 'U') : 'U').toUpperCase()}
              </span>
            </Button>
            {profileOpen ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(100vw-1.5rem,14rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-soft-md">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-sm font-medium">{user?.email ?? tCommon('account')}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
                      tCommon('signedIn')}
                  </p>
                </div>
                <div className="p-1">
                  <Link
                    href={SESSIONS_ROUTE}
                    onClick={() => {
                      setProfileOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <Shield className="size-4 text-muted-foreground" />
                    {tItems('sessions')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                  >
                    <LogOut className="size-4" />
                    {logoutMutation.isPending ? tCommon('signingOut') : t('logout')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn('flex min-w-0 items-center gap-2 border-t border-border/60 py-2 md:hidden', siteGutter)}>
        <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {breadcrumbs.map((c) => c.label).join(' / ') || tItems('dashboard')}
        </p>
      </div>
    </header>
  );
}
