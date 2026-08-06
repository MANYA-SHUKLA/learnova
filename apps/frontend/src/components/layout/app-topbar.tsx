'use client';

import { Badge, Button, Input } from '@learnova/ui';
import {
  Bell,
  ChevronRight,
  Languages,
  LogOut,
  Menu,
  Search,
  Shield,
  UserRound,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useLogoutMutation } from '@/features/auth';
import { locales, type AppLocale } from '@/lib/i18n/config';
import { Link, usePathname, useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

const SESSIONS_ROUTE = '/sessions';

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'EN',
  hi: 'HI',
  te: 'TE',
};

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  institution: 'Institution',
  profile: 'Profile',
  campuses: 'Campuses',
  schools: 'Schools',
  departments: 'Departments',
  programs: 'Programs',
  'academic-years': 'Academic Years',
  semesters: 'Semesters',
  sections: 'Sections',
  batches: 'Batches',
  calendar: 'Calendar',
  settings: 'Settings',
  sessions: 'Sessions',
};

function breadcrumbLabel(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function useBreadcrumbs(pathname: string) {
  return useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: { href: string; label: string }[] = [];
    let acc = '';
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ href: acc, label: breadcrumbLabel(part) });
    }
    return crumbs;
  }, [pathname]);
}

export function AppTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const { user, signOut } = useAuth();
  const logoutMutation = useLogoutMutation();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const breadcrumbs = useBreadcrumbs(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
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

  function switchLocale(next: AppLocale) {
    setLangOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <header className="sticky top-0 z-20 w-full min-w-0 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="flex h-14 min-w-0 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-5 lg:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label="Open navigation"
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
          <div className="relative hidden w-[min(100%,12rem)] shrink lg:block xl:w-[min(100%,16rem)]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              readOnly
              placeholder="Search…"
              className="h-9 w-full min-w-0 cursor-default rounded-xl border-border/80 bg-muted/40 pl-9 text-sm shadow-none"
              aria-label="Search (coming soon)"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell />
            <Badge
              variant="danger"
              className="absolute right-1.5 top-1.5 size-2 rounded-full border-0 p-0"
              aria-hidden
            />
          </Button>

          <div className="relative" ref={langRef}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl px-2.5"
              aria-label="Switch language"
              aria-expanded={langOpen}
              onClick={() => {
                setLangOpen((v) => !v);
              }}
            >
              <Languages className="size-4" />
              <span className="text-xs font-semibold">{LOCALE_LABELS[locale]}</span>
            </Button>
            {langOpen ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[120px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-soft-md">
                {locales.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      switchLocale(code);
                    }}
                    className={cn(
                      'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                      code === locale && 'bg-muted font-medium text-primary',
                    )}
                  >
                    {LOCALE_LABELS[code]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <ThemeToggle />

          <div className="relative" ref={profileRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Profile menu"
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
                  <p className="truncate text-sm font-medium">{user?.email ?? 'Account'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Signed in'}
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
                    Sessions
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                  >
                    <LogOut className="size-4" />
                    {logoutMutation.isPending ? 'Signing out…' : 'Log out'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 border-t border-border/60 px-3 py-2 sm:px-4 md:hidden">
        <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {breadcrumbs.map((c) => c.label).join(' / ') || 'Dashboard'}
        </p>
      </div>
    </header>
  );
}
