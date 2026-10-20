'use client';

import { Button, Input } from '@learnova/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { superadminApi, type DemoRequestRow } from '@/features/superadmin/services/superadmin-api';
import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export default function SuperAdminDashboardPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'requests' | 'campuses' | 'marketing'>('requests');

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
      alert('Campus provisioned — credentials email queued.');
    },
  });

  const [marketingDraft, setMarketingDraft] = useState<string>('');

  const marketingSave = useMutation({
    mutationFn: (body: unknown) => superadminApi.updateMarketing(body as never),
    onSuccess: () => alert('Platform marketing saved'),
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

  return (
    <div className={siteContainer('py-10')}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Learnova platform admin</h1>
          <p className="text-sm text-muted-foreground">Demo requests, campus allocation, and /platform CMS</p>
        </div>
        <Link href="/" className="text-sm text-primary hover:underline">
          View public homepage
        </Link>
      </div>

      <div className="mt-8 flex gap-2">
        {(['requests', 'campuses', 'marketing'] as const).map((key) => (
          <Button key={key} variant={tab === key ? 'default' : 'outline'} onClick={() => setTab(key)}>
            {key}
          </Button>
        ))}
      </div>

      {tab === 'requests' ? (
        <div className="mt-8 space-y-4">
          {(demoQuery.data?.items ?? []).map((row: DemoRequestRow) => (
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
              onDecline={(reason) =>
                declineMutation.mutate({ id: row.id, reason })
              }
            />
          ))}
        </div>
      ) : null}

      {tab === 'campuses' ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <h2 className="font-semibold">Allocate campus</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void provisionMutation.mutateAsync();
              }}
            >
              {(
                [
                  ['institutionName', 'Institution name'],
                  ['slug', 'Slug'],
                  ['code', 'Code'],
                  ['contactEmail', 'Contact email'],
                  ['adminFirstName', 'Admin first name'],
                  ['adminLastName', 'Admin last name'],
                  ['adminEmail', 'Admin login email'],
                  ['initialPassword', 'Initial password'],
                ] as const
              ).map(([key, label]) => (
                <Input
                  key={key}
                  placeholder={label}
                  value={provision[key]}
                  onChange={(e) => setProvision((p) => ({ ...p, [key]: e.target.value }))}
                  required
                />
              ))}
              <Button type="submit" disabled={provisionMutation.isPending}>
                Create campus + email admin
              </Button>
            </form>
          </div>
          <div className="rounded-2xl border border-border p-6">
            <h2 className="font-semibold">Campuses</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {(campusesQuery.data?.items as { id: string; name: string; slug: string }[] | undefined)?.map(
                (inst) => (
                  <li key={inst.id} className="flex items-center justify-between gap-2">
                    <span>
                      {inst.name}{' '}
                      <Link href={`/${inst.slug}`} className="text-primary hover:underline">
                        /{inst.slug}
                      </Link>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void superadminApi.resendCredentials(inst.id, { rotatePassword: true })}
                    >
                      Resend creds
                    </Button>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === 'marketing' && marketingQuery.data ? (
        <div className="mt-8 max-w-3xl">
          <p className="text-sm text-muted-foreground">Edit JSON CMS fields (hero, features, pricing, FAQ).</p>
          <textarea
            className="mt-4 min-h-[320px] w-full rounded-xl border border-input bg-background p-3 font-mono text-xs"
            defaultValue={JSON.stringify(marketingQuery.data, null, 2)}
            onChange={(e) => setMarketingDraft(e.target.value)}
          />
          <Button
            className="mt-4"
            onClick={() => {
              const parsed = JSON.parse(marketingDraft || JSON.stringify(marketingQuery.data));
              void marketingSave.mutateAsync(parsed);
            }}
          >
            Save marketing
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function DemoRequestCard({
  row,
  onConfirm,
  onAllocate,
  onDecline,
}: {
  row: DemoRequestRow;
  onConfirm: (meetingAt: string, notes?: string) => void;
  onAllocate: () => void;
  onDecline: (reason?: string) => void;
}) {
  const [when, setWhen] = useState('');
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  return (
    <div className="rounded-xl border border-border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{row.institutionName}</p>
          <p className="text-muted-foreground">
            {row.contactName} · {row.contactEmail} · {row.phone}
          </p>
          {row.message ? <p className="mt-2">{row.message}</p> : null}
          <p className="mt-1 text-xs uppercase text-muted-foreground">{row.status}</p>
        </div>
        <div className="flex flex-col gap-2">
          {row.status === 'pending' ? (
            <>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              <Input placeholder="Meeting notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button
                size="sm"
                onClick={() => onConfirm(new Date(when).toISOString(), notes || undefined)}
                disabled={!when}
              >
                Confirm meet
              </Button>
              <Input
                placeholder="Decline reason (optional)"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(declineReason || undefined)}
              >
                Decline
              </Button>
            </>
          ) : null}
          {row.status === 'confirmed' ? (
            <Button size="sm" variant="secondary" onClick={onAllocate}>
              Prefill allocate campus
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
