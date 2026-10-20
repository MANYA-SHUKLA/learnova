'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Spinner } from '@learnova/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { PageHeader, useMyInstitution } from '@/features/institution';
import { institutionApi } from '@/features/institution/services/institution-api';
import { Link } from '@/lib/i18n/routing';
import { campusLoginPath } from '@/lib/campus-slugs';

type PortalForm = {
  portalTitle: string;
  portalSubtitle: string;
  termLabel: string;
  supportEmail: string;
  officeLabel: string;
  officialCredit: string;
  developerCredit: string;
  noticesText: string;
  showPlatformLink: boolean;
};

const EMPTY_FORM: PortalForm = {
  portalTitle: '',
  portalSubtitle: '',
  termLabel: '',
  supportEmail: '',
  officeLabel: '',
  officialCredit: '',
  developerCredit: '',
  noticesText: '',
  showPlatformLink: true,
};

export default function InstitutionPortalSettingsPage() {
  const t = useTranslations('dashboard.institution.portal');
  const queryClient = useQueryClient();
  const { data: institution, isLoading } = useMyInstitution();
  const [form, setForm] = useState<PortalForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const ps = institution?.portalSettings;
    if (!ps) return;
    setForm({
      portalTitle: ps.portalTitle ?? '',
      portalSubtitle: ps.portalSubtitle ?? '',
      termLabel: ps.termLabel ?? '',
      supportEmail: ps.supportEmail ?? '',
      officeLabel: ps.officeLabel ?? '',
      officialCredit: ps.officialCredit ?? '',
      developerCredit: ps.developerCredit ?? '',
      noticesText: Array.isArray(ps.notices) ? ps.notices.join('\n') : '',
      showPlatformLink: ps.showPlatformLink !== false,
    });
  }, [institution]);

  const save = useMutation({
    mutationFn: () =>
      institutionApi.updatePortalSettings(institution!.id, {
        portalTitle: form.portalTitle.trim() || null,
        portalSubtitle: form.portalSubtitle.trim() || null,
        termLabel: form.termLabel.trim() || null,
        supportEmail: form.supportEmail.trim() || null,
        officeLabel: form.officeLabel.trim() || null,
        officialCredit: form.officialCredit.trim() || null,
        developerCredit: form.developerCredit.trim() || null,
        showPlatformLink: form.showPlatformLink,
        notices: form.noticesText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['institution'] });
      window.setTimeout(() => setSaved(false), 4000);
    },
  });

  if (isLoading || !institution) {
    return <Spinner className="mx-auto mt-20" />;
  }

  const slug = institution.slug?.trim();
  const publicPath = slug ? `/${slug}` : null;
  const signInPath = slug ? campusLoginPath(slug) : '/login';

  return (
    <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE}>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="mx-auto mt-6 max-w-2xl space-y-6">
        <Card className="rounded-2xl border-border/80 shadow-soft-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('whatIsThisTitle')}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{t('whatIsThisBody')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            {publicPath ? (
              <Button asChild variant="outline" size="sm">
                <Link href={publicPath} target="_blank" rel="noopener noreferrer">
                  {t('openPublicPage', { path: publicPath })}
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary" size="sm">
              <Link href={signInPath} target="_blank" rel="noopener noreferrer">
                {t('openSignIn')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save.mutateAsync();
          }}
        >
          <Field
            id="portalTitle"
            label={t('fields.portalTitle')}
            hint={t('hints.portalTitle')}
            value={form.portalTitle}
            onChange={(v) => setForm((f) => ({ ...f, portalTitle: v }))}
          />
          <Field
            id="portalSubtitle"
            label={t('fields.portalSubtitle')}
            hint={t('hints.portalSubtitle')}
            value={form.portalSubtitle}
            multiline
            onChange={(v) => setForm((f) => ({ ...f, portalSubtitle: v }))}
          />
          <Field
            id="termLabel"
            label={t('fields.termLabel')}
            hint={t('hints.termLabel')}
            value={form.termLabel}
            onChange={(v) => setForm((f) => ({ ...f, termLabel: v }))}
          />
          <Field
            id="supportEmail"
            label={t('fields.supportEmail')}
            hint={t('hints.supportEmail')}
            value={form.supportEmail}
            type="email"
            onChange={(v) => setForm((f) => ({ ...f, supportEmail: v }))}
          />
          <Field
            id="officeLabel"
            label={t('fields.officeLabel')}
            value={form.officeLabel}
            onChange={(v) => setForm((f) => ({ ...f, officeLabel: v }))}
          />
          <Field
            id="officialCredit"
            label={t('fields.officialCredit')}
            value={form.officialCredit}
            onChange={(v) => setForm((f) => ({ ...f, officialCredit: v }))}
          />
          <Field
            id="developerCredit"
            label={t('fields.developerCredit')}
            value={form.developerCredit}
            onChange={(v) => setForm((f) => ({ ...f, developerCredit: v }))}
          />
          <div className="space-y-2">
            <Label htmlFor="notices">{t('fields.notices')}</Label>
            <p className="text-xs text-muted-foreground">{t('hints.notices')}</p>
            <textarea
              id="notices"
              className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={form.noticesText}
              onChange={(e) => setForm((f) => ({ ...f, noticesText: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={form.showPlatformLink}
              onChange={(e) => setForm((f) => ({ ...f, showPlatformLink: e.target.checked }))}
            />
            {t('fields.showPlatformLink')}
          </label>

          {save.isError ? (
            <p className="text-sm text-destructive">{t('saveFailed')}</p>
          ) : null}
          {saved ? <p className="text-sm text-primary">{t('saved')}</p> : null}

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t('saving') : t('save')}
          </Button>
        </form>
      </div>
    </PermissionGate>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  multiline,
  type = 'text',
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {multiline ? (
        <textarea
          id={id}
          className="min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
