'use client';

import { PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Spinner,
} from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  BrandingUpload,
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  useMyInstitution,
  useUpdateBrandingMutation,
  useUpdateInstitutionMutation,
} from '@/features/institution';

export default function InstitutionProfilePage() {
  const t = useTranslations('dashboard.institution.profile');
  const tf = useTranslations('dashboard.institution.fields');
  const tCrud = useTranslations('dashboard.institution.crud');
  const { data, isLoading, isError, error, refetch } = useMyInstitution();
  const updateMutation = useUpdateInstitutionMutation();
  const brandingMutation = useUpdateBrandingMutation();

  const [form, setForm] = useState({
    name: '',
    shortName: '',
    email: '',
    phone: '',
    website: '',
    timezone: '',
    currency: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
    address: '',
  });
  const [branding, setBranding] = useState<{ logo: string | null; favicon: string | null }>({
    logo: null,
    favicon: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      shortName: data.shortName,
      email: data.email,
      phone: data.phone ?? '',
      website: data.website ?? '',
      timezone: data.timezone,
      currency: data.currency,
      country: data.country,
      state: data.state ?? '',
      city: data.city ?? '',
      postalCode: data.postalCode ?? '',
      address: data.address ?? '',
    });
    setBranding({ logo: data.logo, favicon: data.favicon });
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full min-w-0">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-w-0">
        <ErrorState
          message={error instanceof Error ? error.message : t('loadFailed')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-w-0">
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      </div>
    );
  }

  const saveProfile = async () => {
    setFormError(null);
    setMessage(null);
    try {
      await updateMutation.mutateAsync({
        id: data.id,
        body: {
          name: form.name,
          shortName: form.shortName,
          email: form.email,
          phone: form.phone || null,
          website: form.website || null,
          timezone: form.timezone,
          currency: form.currency,
          country: form.country,
          state: form.state || null,
          city: form.city || null,
          postalCode: form.postalCode || null,
          address: form.address || null,
        },
      });
      setMessage(t('profileSaved'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('saveProfileFailed'));
    }
  };

  const saveBranding = async () => {
    setFormError(null);
    setMessage(null);
    try {
      await brandingMutation.mutateAsync({
        id: data.id,
        body: branding,
      });
      setMessage(t('brandingSaved'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('saveBrandingFailed'));
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    opts?: { type?: string; disabled?: boolean; placeholder?: string },
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      <Input
        id={key}
        type={opts?.type ?? 'text'}
        value={form[key]}
        disabled={opts?.disabled}
        placeholder={opts?.placeholder}
        onChange={(e) => { setForm((prev) => ({ ...prev, [key]: e.target.value })); }}
      />
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<StatusBadge status={data.status} />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('details')}</CardTitle>
          <CardDescription>
            {t('codeSlug', { code: data.code, slug: data.slug })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field('name', tf('name'))}
          {field('shortName', t('shortName'))}
          {field('email', tf('email'), {
            type: 'email',
            placeholder: 'shuklamanya99@gmail.com',
          })}
          {field('phone', tf('phone'), { placeholder: '8005586588' })}
          {field('website', t('website'), { type: 'url' })}
          {field('timezone', t('timezone'))}
          {field('currency', t('currency'))}
          {field('country', tf('country'))}
          {field('state', tf('state'))}
          {field('city', tf('city'))}
          {field('postalCode', t('postalCode'))}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="address">
              {tf('address')}
            </label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => { setForm((prev) => ({ ...prev, address: e.target.value })); }}
            />
          </div>
          <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
            <div className="sm:col-span-2">
              <Button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => void saveProfile()}
              >
                {updateMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    {tCrud('saving')}
                  </>
                ) : (
                  t('saveProfile')
                )}
              </Button>
            </div>
          </PermissionGate>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('branding')}</CardTitle>
          <CardDescription>{t('brandingDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrandingUpload
            logo={branding.logo}
            favicon={branding.favicon}
            institutionName={form.name || data.name}
            shortName={form.shortName || data.shortName}
            disabled={brandingMutation.isPending}
            onChange={setBranding}
          />
          <PermissionGate permission={PERMISSIONS.INSTITUTION_MANAGE} enforce>
            <Button
              type="button"
              disabled={brandingMutation.isPending}
              onClick={() => void saveBranding()}
            >
              {brandingMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  {tCrud('saving')}
                </>
              ) : (
                t('saveBranding')
              )}
            </Button>
          </PermissionGate>
        </CardContent>
      </Card>

      {message ? <p className="mt-4 text-sm text-success">{message}</p> : null}
      {formError ? <p className="mt-4 text-sm text-danger">{formError}</p> : null}
    </div>
  );
}
