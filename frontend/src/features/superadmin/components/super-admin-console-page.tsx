'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  Skeleton,
  Spinner,
} from '@learnova/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CalendarClock, Inbox, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { SuccessPopup } from '@/components/shared/success-popup';
import { SuperAdminConsoleShell } from '@/components/superadmin/super-admin-console-shell';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import {
  SuperAdminConsoleSidebar,
  type SuperAdminConsoleTab,
} from '@/components/superadmin/super-admin-console-sidebar';
import { superadminApi, type DemoRequestRow } from '@/features/superadmin/services/superadmin-api';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const TAB_CONFIG: { id: SuperAdminConsoleTab; icon: typeof Inbox }[] = [
  { id: 'requests', icon: Inbox },
  { id: 'campuses', icon: Building2 },
];

function statusVariant(status: DemoRequestRow['status']): 'default' | 'secondary' | 'danger' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
      return 'default';
    case 'declined':
      return 'danger';
    default:
      return 'outline';
  }
}

export function SuperAdminConsolePage() {
  const t = useTranslations('superadmin.console');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SuperAdminConsoleTab>('requests');
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(t('emailSentSuccess'));

  const demoQuery = useQuery({
    queryKey: ['superadmin', 'demo-requests'],
    queryFn: () => superadminApi.listDemoRequests({ page: 1 }),
  });

  const campusesQuery = useQuery({
    queryKey: ['superadmin', 'campuses'],
    queryFn: () => superadminApi.listInstitutions(),
  });

  const [provision, setProvision] = useState({
    institutionName: '',
    contactEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    initialPassword: '',
    demoRequestId: '',
  });

  const provisionMutation = useMutation({
    mutationFn: () => {
      const { demoRequestId, ...body } = provision;
      return superadminApi.provisionCampus({
        ...body,
        ...(demoRequestId.trim() ? { demoRequestId: demoRequestId.trim() } : {}),
      });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['superadmin'] });
      const slug = data.institutionSlug;
      const code = data.institutionCode;
      showSuccess(
        data.credentialsEmailSent
          ? slug
            ? `${t('emailSentSuccess')} ${t('provisionSuccessWithIds', { slug, code: code ?? '' })}`
            : t('emailSentSuccess')
          : slug
            ? t('provisionSuccessWithIds', { slug, code: code ?? '' })
            : t('provisionSuccess'),
      );
    },
    onError: (err: Error) => {
      alert(err.message || t('provisionError'));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, meetingAt, meetingNotes }: { id: string; meetingAt: string; meetingNotes?: string }) =>
      superadminApi.confirmDemoRequest(id, { meetingAt, meetingNotes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['superadmin', 'demo-requests'] });
      showSuccess(t('emailSentMeetingConfirmed'));
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      superadminApi.declineDemoRequest(id, reason ? { reason } : undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['superadmin', 'demo-requests'] });
      showSuccess(t('emailSentDeclined'));
    },
  });

  const pendingCount = useMemo(
    () => (demoQuery.data?.items ?? []).filter((r) => r.status === 'pending').length,
    [demoQuery.data?.items],
  );

  const campusCount = useMemo(() => {
    const items = campusesQuery.data?.items as unknown[] | undefined;
    return items?.length ?? 0;
  }, [campusesQuery.data?.items]);

  const navItems = useMemo(
    () =>
      TAB_CONFIG.map((item) => ({
        ...item,
        badge: item.id === 'requests' ? pendingCount : item.id === 'campuses' ? campusCount : undefined,
      })),
    [pendingCount, campusCount],
  );

  const requestItems = demoQuery.data?.items ?? [];
  const requestsEmpty =
    !demoQuery.isLoading && !demoQuery.isError && requestItems.length === 0;

  return (
    <>
    <SuccessPopup
      open={open}
      message={message}
      onClose={closeSuccess}
      placement="top-right"
      dismissLabel={tCommon('dismissNotification')}
    />
    <SuperAdminConsoleShell
      sidebar={
        <SuperAdminConsoleSidebar
          activeTab={tab}
          onTabChange={setTab}
          navItems={navItems}
          pendingCount={pendingCount}
          campusCount={campusCount}
        />
      }
    >
      <PageHeader
        title={t(`tabs.${tab}`)}
        description={t(tab === 'requests' ? 'descriptionRequests' : 'descriptionCampuses')}
        meta={
          pendingCount > 0 && tab === 'requests' ? (
            <Badge variant="secondary">{t('pendingBadge', { count: pendingCount })}</Badge>
          ) : null
        }
        actions={
          tab === 'requests' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={demoQuery.isFetching}
              onClick={() => void demoQuery.refetch()}
            >
              <RefreshCw className={cn('mr-1.5 size-4', demoQuery.isFetching && 'animate-spin')} />
              {t('refresh')}
            </Button>
          ) : null
        }
      />

      {tab === 'requests' ? (
        <section className="mt-8 space-y-4" aria-labelledby="demo-requests-heading">
            <h2 id="demo-requests-heading" className="sr-only">
              {t('requestsHeading')}
            </h2>

            {demoQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : null}

            {demoQuery.isError ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {t('requestsError')}
                </CardContent>
              </Card>
            ) : null}

            {requestsEmpty ? (
              <Card className="rounded-2xl border-dashed bg-background shadow-soft-sm">
                <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <Inbox className="size-12 text-muted-foreground/50" aria-hidden />
                  <p className="text-lg font-medium text-foreground">{t('requestsEmptyTitle')}</p>
                  <p className="max-w-md text-sm text-muted-foreground">{t('requestsEmptyBody')}</p>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              {requestItems.map((row) => (
                <DemoRequestCard
                  key={row.id}
                  row={row}
                  onConfirm={(meetingAt, notes) =>
                    confirmMutation.mutate({ id: row.id, meetingAt, meetingNotes: notes })
                  }
                  onAllocate={() => {
                    setProvision((p) => ({
                      ...p,
                      institutionName: row.institutionName,
                      contactEmail: row.contactEmail,
                      adminEmail: row.contactEmail,
                      demoRequestId: row.id,
                    }));
                    setTab('campuses');
                  }}
                  onDecline={(reason) => declineMutation.mutate({ id: row.id, reason })}
                  busy={confirmMutation.isPending || declineMutation.isPending}
                />
              ))}
            </div>
        </section>
      ) : null}

      {tab === 'campuses' ? (
        <section className="mt-8 grid gap-6 xl:grid-cols-2 xl:gap-8">
          <Card className="rounded-2xl shadow-soft-sm">
            <CardHeader>
              <CardTitle className="text-lg">{t('allocateTitle')}</CardTitle>
              <CardDescription>{t('allocateDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void provisionMutation.mutateAsync();
                }}
              >
                <p className="text-xs text-muted-foreground">{t('allocateSlugHint')}</p>
                {(
                  [
                    ['institutionName', t('fields.institutionName')],
                    ['contactEmail', t('fields.contactEmail')],
                    ['adminFirstName', t('fields.adminFirstName')],
                    ['adminLastName', t('fields.adminLastName')],
                    ['adminEmail', t('fields.adminEmail')],
                    ['initialPassword', t('fields.initialPassword')],
                  ] as const
                ).map(([key, label]) => (
                  <Input
                    key={key}
                    aria-label={label}
                    placeholder={label}
                    value={provision[key]}
                    onChange={(e) => setProvision((p) => ({ ...p, [key]: e.target.value }))}
                    required
                  />
                ))}
                <Button type="submit" className="w-full sm:w-auto" disabled={provisionMutation.isPending}>
                  {provisionMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                  {t('allocateSubmit')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft-sm">
            <CardHeader>
              <CardTitle className="text-lg">{t('campusesTitle')}</CardTitle>
              <CardDescription>{t('campusesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {campusesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}
              <ul className="divide-y divide-border/60">
                {(campusesQuery.data?.items as { id: string; name: string; slug: string }[] | undefined)?.map(
                  (inst) => (
                    <li key={inst.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{inst.name}</p>
                        <Link href={`/${inst.slug}`} className="text-sm text-primary hover:underline">
                          /{inst.slug}
                        </Link>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void superadminApi
                            .resendCredentials(inst.id, { rotatePassword: true })
                            .then(() => showSuccess(t('emailSentSuccess')))
                            .catch((err: Error) => alert(err.message || t('provisionError')))
                        }
                      >
                        {t('resendCreds')}
                      </Button>
                    </li>
                  ),
                )}
              </ul>
              {!campusesQuery.isLoading && !(campusesQuery.data?.items as unknown[] | undefined)?.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('campusesEmpty')}</p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </SuperAdminConsoleShell>
  );
}

function DemoRequestCard({
  row,
  onConfirm,
  onAllocate,
  onDecline,
  busy,
}: {
  row: DemoRequestRow;
  onConfirm: (meetingAt: string, notes?: string) => void;
  onAllocate: () => void;
  onDecline: (reason?: string) => void;
  busy: boolean;
}) {
  const t = useTranslations('superadmin.console');
  const [when, setWhen] = useState('');
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  return (
    <Card className="rounded-2xl shadow-soft-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{row.institutionName}</h3>
              <Badge variant={statusVariant(row.status)} className="uppercase tracking-wide">
                {row.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {row.contactName} · {row.contactEmail}
              {row.phone ? ` · ${row.phone}` : ''}
            </p>
            {row.message ? (
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">{row.message}</p>
            ) : null}
            {row.createdAt ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" aria-hidden />
                {new Date(row.createdAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-72">
            {row.status === 'pending' ? (
              <>
                <Input
                  type="datetime-local"
                  aria-label={t('meetingWhen')}
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
                <Input
                  placeholder={t('meetingNotes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!when || busy}
                  onClick={() => onConfirm(new Date(when).toISOString(), notes || undefined)}
                >
                  {t('confirmMeet')}
                </Button>
                <Input
                  placeholder={t('declineReason')}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
                <Button size="sm" variant="outline" disabled={busy} onClick={() => onDecline(declineReason || undefined)}>
                  {t('decline')}
                </Button>
              </>
            ) : null}
            {row.status === 'confirmed' ? (
              <Button size="sm" variant="secondary" onClick={onAllocate}>
                {t('prefillAllocate')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
