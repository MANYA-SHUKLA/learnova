'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Badge, Button } from '@learnova/ui';
import { ExternalLink, GraduationCap, LogOut, Menu, Shield, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useLogoutMutation } from '@/features/auth';
import { Link, useRouter } from '@/lib/i18n/routing';
import { siteGutter } from '@/lib/layout';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

interface SuperAdminConsoleShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

function userInitial(user: { firstName?: string; email?: string } | null): string {
  if (!user) return 'S';
  const ch = user.firstName?.charAt(0) ?? user.email?.charAt(0) ?? 'S';
  return ch.toUpperCase();
}

export function SuperAdminConsoleShell({ sidebar, children, className }: SuperAdminConsoleShellProps) {
  const t = useTranslations('superadmin.console');
  const tCommon = useTranslations('common');
  const { user, signOut } = useAuth();
  const router = useRouter();
  const logout = useLogoutMutation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    try {
      await logout.mutateAsync();
    } catch {
      await signOut();
    }
    router.replace(APP_ROUTES.SUPERADMIN_LOGIN);
  }

  return (
    <div className={cn('flex min-h-full flex-1 flex-col', className)}>
      <header className="sticky top-0 z-40 print:hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" aria-hidden />
        <div className="border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md">
          <div
            className={cn(
              siteGutter,
              'flex min-h-[3.5rem] items-center justify-between gap-3 py-2 sm:min-h-16 sm:gap-4 sm:py-0',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label={mobileNavOpen ? tCommon('closeNav') : tCommon('openNav')}
                onClick={() => setMobileNavOpen((o) => !o)}
              >
                {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>

              <Link
                href={APP_ROUTES.CONSOLE}
                className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft-sm transition-transform group-hover:scale-[1.02] sm:size-10">
                  <GraduationCap className="size-[1.125rem] sm:size-5" aria-hidden />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {tCommon('appName')}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{t('eyebrow')}</span>
                </span>
              </Link>

              <Badge
                variant="secondary"
                className="hidden shrink-0 gap-1 border border-primary/15 bg-primary/5 text-primary sm:inline-flex"
              >
                <Shield className="size-3" aria-hidden />
                {t('badge')}
              </Badge>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex" asChild>
                <Link href="/platform">
                  {t('navPlatform')}
                  <ExternalLink className="size-3.5 opacity-60" aria-hidden />
                </Link>
              </Button>

              <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" aria-hidden />

              <div className="hidden items-center gap-0.5 sm:flex">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              <div className="relative" ref={profileRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={tCommon('account')}
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-background">
                    {userInitial(user)}
                  </span>
                </Button>
                {profileOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-1.5rem,15rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-soft-md">
                    <div className="border-b border-border bg-muted/30 px-3 py-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('badge')}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/platform"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted sm:hidden"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ExternalLink className="size-4 text-muted-foreground" />
                        {t('navPlatform')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        disabled={logout.isPending}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                      >
                        <LogOut className="size-4" />
                        {logout.isPending ? tCommon('signingOut') : tCommon('logout')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={cn(
              'flex items-center justify-between gap-2 border-t border-border/60 px-[clamp(0.75rem,1.75vw,2rem)] py-2 sm:hidden',
            )}
          >
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Shield className="size-3" aria-hidden />
              {t('badge')}
            </Badge>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" asChild>
              <Link href="/platform">
                {t('navPlatform')}
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {mobileNavOpen ? (
          <div className="border-b border-border lg:hidden">{sidebar}</div>
        ) : null}
        <div className="hidden min-h-0 lg:flex">{sidebar}</div>

        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-y-auto py-6 sm:py-8 lg:py-10',
            siteGutter,
          )}
        >
          <div className="mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
