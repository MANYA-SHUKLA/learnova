'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Input, Spinner } from '@learnova/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { PageHeader, useMyInstitution } from '@/features/institution';
import { institutionApi } from '@/features/institution/services/institution-api';

export default function InstitutionPortalSettingsPage() {
  const queryClient = useQueryClient();
  const { data: institution, isLoading } = useMyInstitution();
  const [form, setForm] = useState({
    portalTitle: '',
    portalSubtitle: '',
    termLabel: '',
    supportEmail: '',
    officialCredit: '',
    developerCredit: '',
    noticesText: '',
  });

  useEffect(() => {
    const ps = (institution as { portalSettings?: Record<string, unknown> } | undefined)?.portalSettings;
    if (!ps) return;
    setForm({
      portalTitle: (ps['portalTitle'] as string) ?? '',
      portalSubtitle: (ps['portalSubtitle'] as string) ?? '',
      termLabel: (ps['termLabel'] as string) ?? '',
      supportEmail: (ps['supportEmail'] as string) ?? '',
      officialCredit: (ps['officialCredit'] as string) ?? '',
      developerCredit: (ps['developerCredit'] as string) ?? '',
      noticesText: Array.isArray(ps['notices']) ? (ps['notices'] as string[]).join('\n') : '',
    });
  }, [institution]);

  const save = useMutation({
    mutationFn: () =>
      institutionApi.updatePortalSettings(institution!.id, {
        portalTitle: form.portalTitle || null,
        portalSubtitle: form.portalSubtitle || null,
        termLabel: form.termLabel || null,
        supportEmail: form.supportEmail || null,
        officialCredit: form.officialCredit || null,
        developerCredit: form.developerCredit || null,
        notices: form.noticesText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['institution'] }),
  });

  if (isLoading || !institution) {
    return <Spinner className="mx-auto mt-20" />;
  }

  return (
    <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE}>
      <PageHeader title="Campus portal" description="Public trust page copy for /campus/{slug}" />
      <form
        className="mx-auto mt-8 max-w-2xl space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save.mutateAsync();
        }}
      >
        {(
          [
            ['portalTitle', 'Portal title'],
            ['portalSubtitle', 'Subtitle'],
            ['termLabel', 'Term label'],
            ['supportEmail', 'Support email'],
            ['officialCredit', 'Official credit line'],
            ['developerCredit', 'Developer credit line'],
          ] as const
        ).map(([key, label]) => (
          <Input
            key={key}
            placeholder={label}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
        ))}
        <textarea
          className="min-h-[120px] w-full rounded-xl border border-input px-3 py-2 text-sm"
          placeholder="Notices (one per line)"
          value={form.noticesText}
          onChange={(e) => setForm((f) => ({ ...f, noticesText: e.target.value }))}
        />
        {institution.slug ? (
          <p className="text-sm text-muted-foreground">
            Preview:{' '}
            <a className="text-primary hover:underline" href={`/campus/${institution.slug}`}>
              /campus/{institution.slug}
            </a>
          </p>
        ) : null}
        <Button type="submit" disabled={save.isPending}>
          Save portal settings
        </Button>
      </form>
    </PermissionGate>
  );
}
