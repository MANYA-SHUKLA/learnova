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
import { useState, useRef } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatStudentStatus,
  formatStudentGender,
  useMyStudentProfile,
  useUpdateMyStudentProfileMutation,
  useStudentPhotoUploadMutation,
  type StudentUpdateProfileBody,
} from '@/features/student';
import { ApiClientError } from '@/lib/api/client';

export default function StudentProfilePage() {
  const query = useMyStudentProfile();
  const updateMutation = useUpdateMyStudentProfileMutation();
  const photoMutation = useStudentPhotoUploadMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [form, setForm] = useState<StudentUpdateProfileBody>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const student = query.data;

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
        id: student.id,
        contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        data,
      });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      await updateMutation.mutateAsync(form);
      setSuccess('Profile updated successfully.');
      setEditing(false);
      setForm({});
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to update profile.');
    }
  };

  const set = <K extends keyof StudentUpdateProfileBody>(key: K, value: StudentUpdateProfileBody[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_WRITE} enforce>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and update your student profile information.
          </p>
        </div>

        <Card className="overflow-hidden rounded-2xl border-border/80 bg-hero">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
              {student.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.profilePhoto}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl font-semibold text-primary">
                  {student.firstName[0]}
                  {student.lastName[0]}
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
            <CardDescription>Your identity and contact details (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Full name', student.fullName],
              ['Student ID', student.studentId],
              ['Admission number', student.admissionNumber],
              ['Roll number', student.rollNumber],
              ['Email', student.email],
              ['Gender', student.gender ? formatStudentGender(student.gender) : '—'],
              ['Date of birth', student.dateOfBirth?.slice(0, 10) ?? '—'],
              ['Status', formatStudentStatus(student.status)],
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
              <CardTitle className="text-base">Contact & personal</CardTitle>
              <CardDescription>Your editable contact information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                ['Phone', student.phone],
                ['Alternate phone', student.alternatePhone],
                ['Alternate email', student.alternateEmail],
                ['LinkedIn', student.linkedin],
                ['Website', student.website],
                ['Address', student.address],
                ['City', student.city],
                ['State', student.state],
                ['Country', student.country],
                ['Postal code', student.postalCode],
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
              <Button onClick={() => setEditing(true)}>Edit contact details</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Edit contact & personal</CardTitle>
              <CardDescription>Update your contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {success ? <p className="text-sm text-success">{success}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['phone', 'Phone'],
                  ['alternatePhone', 'Alternate phone'],
                  ['alternateEmail', 'Alternate email'],
                  ['linkedin', 'LinkedIn'],
                  ['website', 'Website'],
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['state', 'State'],
                  ['country', 'Country'],
                  ['postalCode', 'Postal code'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm font-medium">{label}</label>
                    <Input
                      value={String(form[key as keyof StudentUpdateProfileBody] ?? student[key as keyof typeof student] ?? '')}
                      onChange={(e) => set(key as keyof StudentUpdateProfileBody, e.target.value || null)}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={String(form.bio ?? student.bio ?? '')}
                  onChange={(e) => set('bio', e.target.value || null)}
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
                    setSuccess(null);
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
            <CardTitle className="text-base">Guardian details</CardTitle>
            <CardDescription>Read-only guardian contact information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Guardian name', student.guardianName],
              ['Guardian relation', student.guardianRelation],
              ['Guardian phone', student.guardianPhone],
              ['Guardian email', student.guardianEmail],
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
            <CardDescription>Your academic program and year information (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Program ID', student.programId],
              ['Department ID', student.departmentId],
              ['Year of study', student.yearOfStudy?.toString()],
              ['Current semester', student.currentSemester?.toString()],
              ['Admission date', student.admissionDate?.slice(0, 10)],
              ['Expected graduation', student.expectedGraduationDate?.slice(0, 10)],
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
