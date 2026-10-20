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
import {
  Building2,
  CalendarClock,
  FileJson,
  Inbox,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { SuperAdminConsoleShell } from '@/components/superadmin/super-admin-console-shell';
import { superadminApi, type DemoRequestRow } from '@/features/superadmin/services/superadmin-api';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

type ConsoleTab = 'requests' | 'campuses' | 'marketing';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

const TAB_CONFIG: { id: ConsoleTab; icon: typeof Inbox }[] = [
  { id: 'requests', icon: Inbox },
  { id: 'campuses', icon: Building2 },
  { id: 'marketing', icon: Megaphone },
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ConsoleTab>('requests');

  const demoQuery = useQuery({
    queryKey: ['superadmin', 'demo-requests'],
    queryFn: () => superadminApi.listDemoRequests({ page: 1 }),
  });

  const campusesQuery = useQuery({
    queryKey: ['superadmin', 'campuses'],
    queryFn: () => superadminApi.listInstitutions(),
    enabled: tab === 'campuses',
  });

  const marketingQuery = useQuery({
    queryKey: ['superadmin', 'marketing'],
    queryFn: () => superadminApi.getMarketing(),
    enabled: tab === 'marketing',
  });

  const [provision, setProvision] = useState({
    institutionName: '',
    slug: '',
    code: '',
    contactEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    initialPassword: '',
    demoRequestId: '',
  });

  const provisionMutation = useMutation({
    mutationFn: () => superadminApi.provisionCampus(provision),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['superadmin'] });
      alert(t('provisionSuccess'));
    },
  });

  const [marketingDraft, setMarketingDraft] = useState('');

  useEffect(() => {
    if (marketingQuery.data && tab === 'marketing') {
      setMarketingDraft(JSON.stringify(marketingQuery.data, null, 2));
    }
  }, [marketingQuery.data, tab]);

  const marketingSave = useMutation({
    mutationFn: (body: unknown) => superadminApi.updateMarketing(body as never),
    onSuccess: () => alert(t('marketingSaved')),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, meetingAt, meetingNotes }: { id: string; meetingAt: string; meetingNotes?: string }) =>
      superadminApi.confirmDemoRequest(id, { meetingAt, meetingNotes }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['superadmin', 'demo-requests'] }),
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      superadminApi.declineDemoRequest(id, reason ? { reason } : undefined),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['superadmin', 'demo-requests'] }),
  });

  const pendingCount = useMemo(
    () => (demoQuery.data?.items ?? []).filter((r) => r.status === 'pending').length,
    [demoQuery.data?.items],
  );

  return (
    <SuperAdminConsoleShell>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        meta={
          pendingCount > 0 ? (
            <Badge variant="secondary">
              {t('pendingBadge', { count: pendingCount })}
            </Badge>
          ) : null
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform">{t('viewPlatformPage')}</Link>
          </Button>
        }
      />

      <div
        className="mt-8 inline-flex w-full max-w-full flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:w-auto"
        role="tablist"
        aria-label={t('tabsLabel')}
      >
        {TAB_CONFIG.map(({ id, icon: Icon }) => (
          <Button
            key={id}
            role="tab"
            aria-selected={tab === id}
            variant={tab === id ? 'default' : 'ghost'}
            size="sm"
            className={cn('flex-1 sm:flex-none', tab !== id && 'text-muted-foreground')}
            onClick={() => setTab(id)}
          >
            <Icon className="mr-1.5 size-4" aria-hidden />
            {t(`tabs.${id}`)}
          </Button>
        ))}
      </div>

      {tab === 'requests' ? (
        <section className="mt-8 space-y-4" aria-labelledby="demo-requests-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="demo-requests-heading" className="text-lg font-semibold text-foreground">
              {t('requestsHeading')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={demoQuery.isFetching}
              onClick={() => void demoQuery.refetch()}
            >
              <RefreshCw className={cn('mr-1.5 size-4', demoQuery.isFetching && 'animate-spin')} />
              {t('refresh')}
            </Button>
          </div>

          {demoQuery.isLoading ? (
            <div className="space-y-3">
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

          {!demoQuery.isLoading && !demoQuery.isError && (demoQuery.data?.items ?? []).length === 0 ? (
            <Card className="rounded-2xl border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <Inbox className="size-10 text-muted-foreground/60" aria-hidden />
                <p className="font-medium text-foreground">{t('requestsEmptyTitle')}</p>
                <p className="max-w-sm text-sm text-muted-foreground">{t('requestsEmptyBody')}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/platform">{t('viewPlatformPage')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {(demoQuery.data?.items ?? []).map((row) => (
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
                  slug: slugify(row.institutionName),
                  code: slugify(row.institutionName).replace(/-/g, '_').toUpperCase().slice(0, 12),
                  demoRequestId: row.id,
                }));
                setTab('campuses');
              }}
              onDecline={(reason) => declineMutation.mutate({ id: row.id, reason })}
              busy={confirmMutation.isPending || declineMutation.isPending}
            />
          ))}
        </section>
      ) : null}

      {tab === 'campuses' ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
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
                {(
                  [
                    ['institutionName', t('fields.institutionName')],
                    ['slug', t('fields.slug')],
                    ['code', t('fields.code')],
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
                            .then(() => alert(t('credsQueued')))
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

      {tab === 'marketing' ? (
        <section className="mt-8 max-w-3xl">
          <Card className="rounded-2xl shadow-soft-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileJson className="size-5 text-primary" aria-hidden />
                {t('marketingTitle')}
              </CardTitle>
              <CardDescription>{t('marketingDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {marketingQuery.isLoading ? (
                <Skeleton className="min-h-[320px] w-full rounded-xl" />
              ) : marketingQuery.data ? (
                <>
                  <textarea
                    className="min-h-[320px] w-full rounded-xl border border-input bg-background p-4 font-mono text-xs leading-relaxed shadow-inner"
                    value={marketingDraft}
                    onChange={(e) => setMarketingDraft(e.target.value)}
                    spellCheck={false}
                  />
                  <Button
                    className="mt-4"
                    disabled={marketingSave.isPending}
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(marketingDraft);
                        void marketingSave.mutateAsync(parsed);
                      } catch {
                        alert(t('marketingInvalidJson'));
                      }
                    }}
                  >
                    {marketingSave.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                    {t('marketingSave')}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('marketingLoadError')}</p>
              )}
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
