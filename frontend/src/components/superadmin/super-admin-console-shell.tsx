'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Badge, Button } from '@learnova/ui';
import { ExternalLink, GraduationCap, LogOut, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useLogoutMutation } from '@/features/auth';
import { Link } from '@/lib/i18n/routing';
import { siteContainer, siteGutter } from '@/lib/layout';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

interface SuperAdminConsoleShellProps {
  children: ReactNode;
  className?: string;
}

export function SuperAdminConsoleShell({ children, className }: SuperAdminConsoleShellProps) {
  const t = useTranslations('superadmin.console');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const logout = useLogoutMutation();

  return (
    <div className={cn('flex min-h-full flex-1 flex-col', className)}>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className={cn(siteGutter, 'flex h-14 items-center justify-between gap-4')}>
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={APP_ROUTES.CONSOLE}
              className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-4" aria-hidden />
              </span>
              <span className="truncate">{tCommon('appName')}</span>
            </Link>
            <Badge variant="secondary" className="hidden gap-1 sm:inline-flex">
              <Shield className="size-3" aria-hidden />
              {t('badge')}
            </Badge>
          </div>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform">{t('navPlatform')}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                {t('navHome')}
                <ExternalLink className="ml-1 size-3.5 opacity-60" aria-hidden />
              </Link>
            </Button>
            {user?.email ? (
              <span className="hidden max-w-[12rem] truncate text-xs text-muted-foreground md:inline">
                {user.email}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={logout.isPending}
              onClick={() => void logout.mutateAsync()}
            >
              <LogOut className="size-3.5 sm:mr-1.5" aria-hidden />
              <span className="hidden sm:inline">{tCommon('logout')}</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className={cn(siteContainer('mx-auto w-full max-w-6xl flex-1 py-8 lg:py-10'))}>{children}</main>
    </div>
  );
}
