'use client';

import { APP_ROUTES } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Spinner,
} from '@learnova/ui';
import { Building2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BrandingUpload } from '@/features/institution/components/branding-upload';
import {
  useCreateInstitutionMutation,
  useMyInstitution,
  useUpdateBrandingMutation,
  useUpdateInstitutionMutation,
} from '@/features/institution';
import { ApiClientError } from '@/lib/api/client';
import {
  codeFromName,
  isInstitutionNotFound,
  isInstitutionSetupComplete,
  shortNameFromName,
  slugifyInstitution,
} from '@/lib/onboarding';
import { useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
] as const;

const STEPS = ['Create Institution', 'Configure Profile', 'Start Managing'] as const;

export default function InstitutionSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const institutionQuery = useMyInstitution();
  const createMutation = useCreateInstitutionMutation();
  const updateMutation = useUpdateInstitutionMutation();
  const brandingMutation = useUpdateBrandingMutation();

  const missing = isInstitutionNotFound(institutionQuery.error);
  const institution = missing ? null : institutionQuery.data;

  const [form, setForm] = useState({
    name: '',
    shortName: '',
    code: '',
    email: user?.email ?? '',
    phone: '',
    timezone: 'Asia/Kolkata',
    country: 'India',
    address: '',
    city: '',
    state: '',
  });
  const [branding, setBranding] = useState<{ logo: string | null; favicon: string | null }>({
    logo: null,
    favicon: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!institution) return;
    setForm({
      name: institution.name,
      shortName: institution.shortName,
      code: institution.code,
      email: institution.email,
      phone: institution.phone ?? '',
      timezone: institution.timezone || 'Asia/Kolkata',
      country: institution.country || 'India',
      address: institution.address ?? '',
      city: institution.city ?? '',
      state: institution.state ?? '',
    });
    setBranding({ logo: institution.logo, favicon: institution.favicon });
  }, [institution]);

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => (prev.email ? prev : { ...prev, email: user.email }));
  }, [user?.email]);

  const activeStep = useMemo(() => {
    if (!institution) return 0;
    if (!isInstitutionSetupComplete(institution)) return 1;
    return 2;
  }, [institution]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !institution) {
        if (!prev.shortName || prev.shortName === shortNameFromName(prev.name)) {
          next.shortName = shortNameFromName(value);
        }
        if (!prev.code || prev.code === codeFromName(prev.name)) {
          next.code = codeFromName(value);
        }
      }
      return next;
    });
  };

  const finishSetup = async () => {
    setError(null);
    setSaving(true);
    try {
      const slug = slugifyInstitution(form.name) || 'institution';
      const code = form.code.trim() || codeFromName(form.name);
      const shortName = form.shortName.trim() || shortNameFromName(form.name);

      let id = institution?.id;

      if (!id) {
        const created = await createMutation.mutateAsync({
          name: form.name.trim(),
          shortName,
          slug,
          code,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          timezone: form.timezone,
          country: form.country.trim(),
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          currency: 'INR',
        });
        id = created.id;
      } else {
        await updateMutation.mutateAsync({
          id,
          body: {
            name: form.name.trim(),
            shortName,
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            timezone: form.timezone,
            country: form.country.trim(),
            address: form.address.trim() || null,
            city: form.city.trim() || null,
            state: form.state.trim() || null,
          },
        });
      }

      if (branding.logo || branding.favicon) {
        await brandingMutation.mutateAsync({
          id,
          body: branding,
        });
      }

      router.replace(APP_ROUTES.INSTITUTION_DASHBOARD);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to finish setup.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (institutionQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Onboarding</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Institution setup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete your campus profile, then start managing academic structure.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((label, index) => {
          const done = index < activeStep;
          const current = index === activeStep;
          return (
            <li key={label}>
              <div
                className={[
                  'flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm',
                  current
                    ? 'border-primary/40 bg-primary/5 text-foreground'
                    : done
                      ? 'border-success/30 bg-success/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    done
                      ? 'bg-success text-success-foreground'
                      : current
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className="font-medium leading-tight">{label}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/80 shadow-soft-md">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <CardTitle className="text-lg">Configure profile</CardTitle>
                <CardDescription>
                  Logo, contact details, location, and branding for your institution.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Institution name"
                value={form.name}
                onChange={(v) => setField('name', v)}
                disabled={saving}
                required
              />
              <Field
                label="Short name"
                value={form.shortName}
                onChange={(v) => setField('shortName', v)}
                disabled={saving}
                required
              />
              <Field
                label="Institution code"
                value={form.code}
                onChange={(v) => setField('code', v)}
                disabled={saving || Boolean(institution)}
                required
              />
              <Field
                label="Institution email"
                type="email"
                value={form.email}
                onChange={(v) => setField('email', v)}
                disabled={saving}
                required
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(v) => setField('phone', v)}
                disabled={saving}
                placeholder="+91…"
              />
              <div className="space-y-1.5">
                <label htmlFor="timezone" className="text-sm font-medium">
                  Timezone
                </label>
                <select
                  id="timezone"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={form.timezone}
                  disabled={saving}
                  onChange={(e) => setField('timezone', e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Country"
                value={form.country}
                onChange={(v) => setField('country', v)}
                disabled={saving}
                required
              />
              <Field
                label="City"
                value={form.city}
                onChange={(v) => setField('city', v)}
                disabled={saving}
              />
              <Field
                label="State"
                value={form.state}
                onChange={(v) => setField('state', v)}
                disabled={saving}
              />
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <Input
                  id="address"
                  value={form.address}
                  disabled={saving}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Campus address"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <p className="text-sm font-medium">Branding</p>
              <BrandingUpload
                logo={branding.logo}
                favicon={branding.favicon}
                onChange={setBranding}
                disabled={saving}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={saving || !form.name.trim() || !form.email.trim() || !form.country.trim()}
              onClick={() => void finishSetup()}
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  Saving…
                </>
              ) : (
                'Finish Setup'
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
