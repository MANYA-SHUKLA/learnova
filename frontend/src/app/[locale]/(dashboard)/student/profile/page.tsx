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
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useRef } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { SuccessPopup } from '@/components/shared/success-popup';
import { ErrorState, useOrgLabels } from '@/features/institution';
import type { StudentGender } from '@learnova/types';
import {
  formatStudentStatus,
  formatStudentGender,
  STUDENT_GENDER_LABELS,
  useMyStudentProfile,
  useUpdateMyStudentProfileMutation,
  useStudentPhotoUploadMutation,
  type StudentUpdateProfileBody,
} from '@/features/student';
import { useSuccessPopup } from '@/hooks/use-success-popup';
import { ApiClientError } from '@/lib/api/client';

export default function StudentProfilePage() {
  const t = useTranslations('common');
  const query = useMyStudentProfile();
  const labels = useOrgLabels();
  const updateMutation = useUpdateMyStudentProfileMutation();
  const photoMutation = useStudentPhotoUploadMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const { open, message, showSuccess, closeSuccess } = useSuccessPopup(t('savedSuccessfully'));

  const [form, setForm] = useState<StudentUpdateProfileBody>({});
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(false);
  const [editingBasic, setEditingBasic] = useState(false);

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
      setEditingGuardian(false);
      setEditingBasic(false);
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
          {!editingBasic ? (
            <>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Basic information</CardTitle>
                  <CardDescription>
                    Student ID, admission number, and email are managed by the institution. Update
                    your name, roll number, gender, and date of birth below.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  className="shrink-0 rounded-xl"
                  onClick={() => {
                    setEditing(false);
                    setEditingGuardian(false);
                    setEditingBasic(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Update basic details
                </Button>
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
                    <p className="mt-1 text-sm font-medium">{value || '—'}</p>
                  </div>
                ))}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">Update basic information</CardTitle>
                <CardDescription>
                  Save when finished. ID, admission number, and login email stay unchanged.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Student ID
                  </p>
                  <p className="mt-1 text-sm font-medium">{student.studentId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Admission number
                  </p>
                  <p className="mt-1 text-sm font-medium">{student.admissionNumber}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-medium">{student.email}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">First name</label>
                  <Input
                    value={form.firstName ?? student.firstName}
                    onChange={(e) => {
                      set('firstName', e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Middle name</label>
                  <Input
                    value={String(form.middleName ?? student.middleName ?? '')}
                    onChange={(e) => {
                      set('middleName', e.target.value || null);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Last name</label>
                  <Input
                    value={form.lastName ?? student.lastName}
                    onChange={(e) => {
                      set('lastName', e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Roll number</label>
                  <Input
                    value={String(form.rollNumber ?? student.rollNumber ?? '')}
                    onChange={(e) => {
                      set('rollNumber', e.target.value || null);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Gender</label>
                  <select
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    value={form.gender ?? student.gender ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      set('gender', value ? (value as StudentGender) : null);
                    }}
                  >
                    <option value="">Not specified</option>
                    {(Object.keys(STUDENT_GENDER_LABELS) as StudentGender[]).map((key) => (
                      <option key={key} value={key}>
                        {STUDENT_GENDER_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date of birth</label>
                  <Input
                    type="date"
                    value={
                      form.dateOfBirth !== undefined
                        ? form.dateOfBirth ?? ''
                        : student.dateOfBirth?.slice(0, 10) ?? ''
                    }
                    onChange={(e) => {
                      set('dateOfBirth', e.target.value || null);
                    }}
                  />
                </div>
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
                    setEditingBasic(false);
                    setForm({});
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              </CardContent>
            </>
          )}
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
              <Button
                onClick={() => {
                  setEditingBasic(false);
                  setEditingGuardian(false);
                  setEditing(true);
                }}
              >
                Edit contact details
              </Button>
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
                      onChange={(e) => { set(key as keyof StudentUpdateProfileBody, e.target.value || null); }}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={String(form.bio ?? student.bio ?? '')}
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

        {!editingGuardian ? (
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="text-base">Guardian details</CardTitle>
                <CardDescription>
                  Add or update parent or guardian contact information anytime.
                </CardDescription>
              </div>
              <Button
                type="button"
                className="shrink-0 rounded-xl"
                onClick={() => {
                  setEditing(false);
                  setEditingBasic(false);
                  setEditingGuardian(true);
                }}
              >
                <Pencil className="size-4" />
                Update guardian details
              </Button>
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
        ) : (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Edit guardian details</CardTitle>
              <CardDescription>Update parent or guardian contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['guardianName', 'Guardian name'],
                    ['guardianRelation', 'Guardian relation'],
                    ['guardianPhone', 'Guardian phone'],
                    ['guardianEmail', 'Guardian email'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm font-medium">{label}</label>
                    <Input
                      value={String(form[key] ?? student[key] ?? '')}
                      onChange={(e) => {
                        set(key, e.target.value || null);
                      }}
                    />
                  </div>
                ))}
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
                    setEditingGuardian(false);
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
            <CardTitle className="text-base">Academic details</CardTitle>
            <CardDescription>
              Program year and term are updated by the academic office when you advance. Expected
              graduation is based on program length and your year (e.g. 4 years in year 1, 2 years
              left in year 2 of a 4-year program).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Program', labels.program(student.programId)],
              ['Department', labels.department(student.departmentId)],
              ['Section / class', labels.section(student.sectionId)],
              ['Batch', labels.batch(student.batchId)],
              ['Year of study', student.yearOfStudy != null ? `Year ${student.yearOfStudy}` : null],
              ['Current semester', student.currentSemester?.toString()],
              ['Term', labels.semester(student.semesterId)],
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
