'use client';

import type { Session } from '@learnova/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';
import {
  useLogoutAllMutation,
  useRevokeSessionMutation,
  useSessions,
} from '@/features/auth';

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function SessionsPage() {
  const t = useTranslations('dashboard.sessions');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: sessions, isLoading, isError, error, refetch } = useSessions(
    isAuthenticated && !authLoading,
  );
  const revokeMutation = useRevokeSessionMutation();
  const logoutAllMutation = useLogoutAllMutation();

  const sessionLabel = (session: Session) => {
    const parts = [session.browser, session.os, session.deviceType].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : t('unknownDevice');
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('signInPrompt')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleRevoke = async (sessionId: string, isCurrent?: boolean) => {
    await revokeMutation.mutateAsync(sessionId);
    if (isCurrent) {
      router.replace('/login');
    }
  };

  const handleLogoutAll = async () => {
    await logoutAllMutation.mutateAsync();
    router.replace('/login');
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="danger"
          className="w-full sm:w-auto"
          disabled={logoutAllMutation.isPending}
          onClick={() => void handleLogoutAll()}
        >
          {logoutAllMutation.isPending ? (
            <>
              <Spinner size="sm" />
              {t('signingOut')}
            </>
          ) : (
            t('signOutAll')
          )}
        </Button>
      </div>

      {isError ? (
        <Card className="mb-4">
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <p className="text-sm text-danger">
              {error instanceof Error ? error.message : t('loadFailed')}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {(sessions ?? []).map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row sm:items-start sm:gap-4">
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="text-base">{sessionLabel(session)}</CardTitle>
                <CardDescription className="break-words">
                  {t('lastActive', { when: formatDate(session.lastActivityAt) })}
                  {session.ipAddress ? ` · ${session.ipAddress}` : ''}
                  {session.country ? ` · ${session.country}` : ''}
                </CardDescription>
              </div>
              {session.isCurrent ? <Badge variant="success">{t('current')}</Badge> : null}
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t('startedExpires', {
                  started: formatDate(session.createdAt),
                  expires: formatDate(session.expiresAt),
                })}
              </p>
              <Button
                variant={session.isCurrent ? 'danger' : 'outline'}
                size="sm"
                disabled={revokeMutation.isPending}
                onClick={() => void handleRevoke(session.id, session.isCurrent)}
              >
                {session.isCurrent ? t('signOut') : t('revoke')}
              </Button>
            </CardContent>
          </Card>
        ))}

        {!isLoading && (sessions?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">{t('empty')}</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
