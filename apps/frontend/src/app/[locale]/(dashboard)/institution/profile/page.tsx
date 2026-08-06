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
          message={error instanceof Error ? error.message : 'Failed to load profile.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-w-0">
        <EmptyState title="No institution" description="Nothing to display." />
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
      setMessage('Profile saved.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save profile.');
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
      setMessage('Branding saved.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save branding.');
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    opts?: { type?: string; disabled?: boolean },
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
        onChange={(e) => { setForm((prev) => ({ ...prev, [key]: e.target.value })); }}
      />
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Institution profile"
        description="Update identity, contact details, and branding URLs."
        actions={<StatusBadge status={data.status} />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>
            Code <span className="font-medium text-foreground">{data.code}</span> · Slug{' '}
            <span className="font-medium text-foreground">{data.slug}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field('name', 'Name')}
          {field('shortName', 'Short name')}
          {field('email', 'Email', { type: 'email' })}
          {field('phone', 'Phone')}
          {field('website', 'Website', { type: 'url' })}
          {field('timezone', 'Timezone')}
          {field('currency', 'Currency')}
          {field('country', 'Country')}
          {field('state', 'State')}
          {field('city', 'City')}
          {field('postalCode', 'Postal code')}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="address">
              Address
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
                    Saving…
                  </>
                ) : (
                  'Save profile'
                )}
              </Button>
            </div>
          </PermissionGate>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
          <CardDescription>
            Provide hosted image URLs (storage abstraction — no file upload).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrandingUpload
            logo={branding.logo}
            favicon={branding.favicon}
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
                  Saving…
                </>
              ) : (
                'Save branding'
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
