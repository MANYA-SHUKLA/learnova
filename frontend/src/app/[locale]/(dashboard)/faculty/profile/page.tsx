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
import { useState, useRef } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { SuccessPopup } from '@/components/shared/success-popup';
import { ErrorState } from '@/features/institution';
import {
  useMyFacultyProfile,
  useUpdateMyFacultyProfileMutation,
  useFacultyPhotoUploadMutation,
  type FacultyUpdateProfileBody,
} from '@/features/faculty';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { ApiClientError } from '@/lib/api/client';

export default function FacultyProfilePage() {
  const t = useTranslations('common');
  const query = useMyFacultyProfile();
  const updateMutation = useUpdateMyFacultyProfileMutation();
  const photoMutation = useFacultyPhotoUploadMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(t('savedSuccessfully'));

  const [form, setForm] = useState<FacultyUpdateProfileBody>({});
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : 'Unable to load profile.'}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const faculty = query.data;

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    setPhotoError(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'] as const;
    if (!allowed.includes(file.type as (typeof allowed)[number])) {
      setPhotoError('Use JPEG, PNG, or WebP.');
      return;
    }
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const data = btoa(binary);
    try {
      await photoMutation.mutateAsync({
        id: faculty.id,
        contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        data,
      });
      showSuccess(t('savedSuccessfully'));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const onSubmit = async () => {
    setError(null);
    try {
      await updateMutation.mutateAsync(form);
      showSuccess(t('savedSuccessfully'));
      setEditing(false);
      setForm({});
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to update profile.');
    }
  };

  const set = <K extends keyof FacultyUpdateProfileBody>(key: K, value: FacultyUpdateProfileBody[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PermissionGate permission={PERMISSIONS.FACULTY_WRITE} enforce>
      <SuccessPopup
        open={open}
        message={message}
        dismissLabel={t('dismissNotification')}
        onClose={closeSuccess}
      />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and update your faculty profile information.
          </p>
        </div>

        <Card className="overflow-hidden rounded-2xl border-border/80 bg-hero">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
              {faculty.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faculty.profilePhoto}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl font-semibold text-primary">
                  {faculty.firstName[0]}
                  {faculty.lastName[0]}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-base">Profile photo</CardTitle>
              <CardDescription>Upload or replace your profile photo.</CardDescription>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={photoMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {photoMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    Uploading…
                  </>
                ) : (
                  'Upload / replace'
                )}
              </Button>
              {photoError ? <p className="text-xs text-danger">{photoError}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Basic information</CardTitle>
            <CardDescription>Your identity and employment details (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Full name', `${faculty.firstName} ${faculty.middleName ? faculty.middleName + ' ' : ''}${faculty.lastName}`],
              ['Employee ID', faculty.employeeId],
              ['Faculty Code', faculty.facultyCode],
              ['Email', faculty.email],
              ['Designation', faculty.designation],
              ['Employment Type', faculty.employmentType],
              ['Gender', faculty.gender ?? '—'],
              ['Date of birth', faculty.dateOfBirth?.slice(0, 10) ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {!editing ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Contact & office</CardTitle>
              <CardDescription>Your editable contact and office information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                ['Phone', faculty.phone],
                ['Alternate phone', faculty.alternatePhone],
                ['Alternate email', faculty.alternateEmail],
                ['Office room', faculty.officeRoom],
                ['Office hours', faculty.officeHours],
                ['LinkedIn', faculty.linkedin],
                ['Website', faculty.website],
                ['ORCID', faculty.orcid],
                ['Google Scholar', faculty.googleScholar],
                ['Address', faculty.address],
                ['City', faculty.city],
                ['State', faculty.state],
                ['Country', faculty.country],
                ['Postal code', faculty.postalCode],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium">{value || '—'}</p>
                </div>
              ))}
            </CardContent>
            <CardContent>
              <Button onClick={() => { setEditing(true); }}>Edit contact details</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Edit contact & office</CardTitle>
              <CardDescription>Update your contact and office information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['phone', 'Phone'],
                  ['alternatePhone', 'Alternate phone'],
                  ['alternateEmail', 'Alternate email'],
                  ['officeRoom', 'Office room'],
                  ['officeHours', 'Office hours'],
                  ['linkedin', 'LinkedIn'],
                  ['website', 'Website'],
                  ['orcid', 'ORCID'],
                  ['googleScholar', 'Google Scholar'],
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['state', 'State'],
                  ['country', 'Country'],
                  ['postalCode', 'Postal code'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm font-medium">{label}</label>
                    <Input
                      value={String(form[key as keyof FacultyUpdateProfileBody] ?? faculty[key as keyof typeof faculty] ?? '')}
                      onChange={(e) => { set(key as keyof FacultyUpdateProfileBody, e.target.value || null); }}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={String(form.bio ?? faculty.bio ?? '')}
                  onChange={(e) => { set('bio', e.target.value || null); }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() => void onSubmit()}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    setEditing(false);
                    setForm({});
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Emergency contact</CardTitle>
            <CardDescription>Your emergency contact information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Contact name', faculty.emergencyContactName],
              ['Contact phone', faculty.emergencyContactPhone],
              ['Contact relation', faculty.emergencyContactRelation],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium">{value || '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Academic details</CardTitle>
            <CardDescription>Your academic qualifications and research areas (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['Highest qualification', faculty.highestQualification],
              ['Specialization', faculty.specialization],
              ['Experience', faculty.experienceYears ? `${faculty.experienceYears} years` : '—'],
              ['Joining date', faculty.joiningDate?.slice(0, 10)],
              ['Research areas', faculty.researchAreas?.join(', ')],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium">{value || '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
