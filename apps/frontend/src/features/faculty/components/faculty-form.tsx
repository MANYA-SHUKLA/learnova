'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from '@learnova/ui';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  DESIGNATION_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  FACULTY_STATUS_LABELS,
  useCreateFacultyMutation,
  useUpdateFacultyMutation,
  type Faculty,
  type FacultyCreateBody,
} from '@/features/faculty';
import { ApiClientError } from '@/lib/api/client';
import { useRouter } from '@/lib/i18n/routing';

const DESIGNATIONS = Object.keys(DESIGNATION_LABELS) as Array<keyof typeof DESIGNATION_LABELS>;
const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as Array<
  keyof typeof EMPLOYMENT_TYPE_LABELS
>;
const STATUSES = Object.keys(FACULTY_STATUS_LABELS) as Array<keyof typeof FACULTY_STATUS_LABELS>;

interface FacultyFormProps {
  mode: 'create' | 'edit';
  initial?: Faculty;
}

export function FacultyForm({ mode, initial }: FacultyFormProps) {
  const router = useRouter();
  const createMutation = useCreateFacultyMutation();
  const updateMutation = useUpdateFacultyMutation();
  const pending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState({
    employeeId: initial?.employeeId ?? '',
    facultyCode: initial?.facultyCode ?? '',
    firstName: initial?.firstName ?? '',
    middleName: initial?.middleName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    designation: initial?.designation ?? 'assistant_professor',
    customDesignation: initial?.customDesignation ?? '',
    employmentType: initial?.employmentType ?? 'full_time',
    departmentId: initial?.departmentId ?? '',
    schoolId: initial?.schoolId ?? '',
    campusId: initial?.campusId ?? '',
    experienceYears: String(initial?.experienceYears ?? 0),
    specialization: initial?.specialization ?? '',
    researchAreas: (initial?.researchAreas ?? []).join(', '),
    programIds: (initial?.programIds ?? []).join(', '),
    courseIds: (initial?.courseIds ?? []).join(', '),
    academicYearId: initial?.academicYearId ?? '',
    semesterId: initial?.semesterId ?? '',
    officeRoom: initial?.officeRoom ?? '',
    officeHours: initial?.officeHours ?? '',
    bio: initial?.bio ?? '',
    status: initial?.status ?? 'active',
    highestQualification: initial?.highestQualification ?? '',
    country: initial?.country ?? '',
    city: initial?.city ?? '',
    address: initial?.address ?? '',
    alternatePhone: initial?.alternatePhone ?? '',
    gender: initial?.gender ?? '',
    dateOfBirth: initial?.dateOfBirth?.slice(0, 10) ?? '',
    joiningDate: initial?.joiningDate?.slice(0, 10) ?? '',
    emergencyContactName: initial?.emergencyContactName ?? '',
    emergencyContactPhone: initial?.emergencyContactPhone ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    setError(null);
    const body: FacultyCreateBody = {
      employeeId: form.employeeId.trim(),
      facultyCode: form.facultyCode.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      designation: form.designation as FacultyCreateBody['designation'],
      customDesignation: form.customDesignation.trim() || null,
      employmentType: form.employmentType as FacultyCreateBody['employmentType'],
      departmentId: form.departmentId.trim() || null,
      schoolId: form.schoolId.trim() || null,
      campusId: form.campusId.trim() || null,
      experienceYears: Number(form.experienceYears) || 0,
      specialization: form.specialization.trim() || null,
      researchAreas: form.researchAreas
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      programIds: form.programIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      courseIds: form.courseIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      academicYearId: form.academicYearId.trim() || null,
      semesterId: form.semesterId.trim() || null,
      officeRoom: form.officeRoom.trim() || null,
      officeHours: form.officeHours.trim() || null,
      bio: form.bio.trim() || null,
      status: form.status as FacultyCreateBody['status'],
      highestQualification: form.highestQualification.trim() || null,
      country: form.country.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      alternatePhone: form.alternatePhone.trim() || null,
      gender: (form.gender || null) as FacultyCreateBody['gender'],
      dateOfBirth: form.dateOfBirth || null,
      joiningDate: form.joiningDate || null,
      emergencyContactName: form.emergencyContactName.trim() || null,
      emergencyContactPhone: form.emergencyContactPhone.trim() || null,
    };

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync(body);
        router.push(`${APP_ROUTES.INSTITUTION_FACULTY}/${created.id}`);
      } else if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, body });
        router.push(`${APP_ROUTES.INSTITUTION_FACULTY}/${initial.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save faculty.');
    }
  };

  const field = (key: keyof typeof form, label: string, opts?: { type?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      <Input
        id={key}
        type={opts?.type ?? 'text'}
        value={form[key]}
        disabled={pending}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <PermissionGate permission={PERMISSIONS.FACULTY_MANAGE} enforce>
      <Card className="mx-auto w-full max-w-3xl rounded-2xl border-border/80 shadow-soft-md">
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create faculty' : 'Edit faculty'}</CardTitle>
          <CardDescription>
            Capture employment, academic, and contact details for the faculty member.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {field('employeeId', 'Employee ID')}
            {field('facultyCode', 'Faculty code')}
            {field('firstName', 'First name')}
            {field('middleName', 'Middle name')}
            {field('lastName', 'Last name')}
            {field('email', 'Email', { type: 'email' })}
            {field('phone', 'Phone')}
            {field('alternatePhone', 'Alternate phone')}
            {field('dateOfBirth', 'Date of birth', { type: 'date' })}
            {field('joiningDate', 'Joining date', { type: 'date' })}
            {field('experienceYears', 'Experience (years)', { type: 'number' })}
            {field('departmentId', 'Department ID')}
            {field('schoolId', 'School ID')}
            {field('campusId', 'Campus ID')}
            {field('academicYearId', 'Academic year ID')}
            {field('semesterId', 'Semester ID')}
            {field('specialization', 'Specialization')}
            {field('highestQualification', 'Highest qualification')}
            {field('officeRoom', 'Office room')}
            {field('officeHours', 'Office hours')}
            {field('city', 'City')}
            {field('country', 'Country')}
            {field('emergencyContactName', 'Emergency contact')}
            {field('emergencyContactPhone', 'Emergency phone')}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              id="gender"
              label="Gender"
              value={form.gender || ''}
              disabled={pending}
              onChange={(v) => set('gender', v)}
              options={[
                { value: '', label: 'Not set' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]}
            />
            <SelectField
              id="designation"
              label="Designation"
              value={form.designation}
              disabled={pending}
              onChange={(v) => set('designation', v)}
              options={DESIGNATIONS.map((d) => ({ value: d, label: DESIGNATION_LABELS[d] }))}
            />
            <SelectField
              id="employmentType"
              label="Employment type"
              value={form.employmentType}
              disabled={pending}
              onChange={(v) => set('employmentType', v)}
              options={EMPLOYMENT_TYPES.map((d) => ({
                value: d,
                label: EMPLOYMENT_TYPE_LABELS[d],
              }))}
            />
            <SelectField
              id="status"
              label="Status"
              value={form.status}
              disabled={pending}
              onChange={(v) => set('status', v)}
              options={STATUSES.filter((s) => s !== 'archived').map((d) => ({
                value: d,
                label: FACULTY_STATUS_LABELS[d],
              }))}
            />
          </div>

          {form.designation === 'custom' ? field('customDesignation', 'Custom designation') : null}
          {field('programIds', 'Program IDs (comma separated)')}
          {field('courseIds', 'Course IDs — placeholder until Courses module')}
          {field('researchAreas', 'Research areas (comma separated)')}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.bio}
              disabled={pending}
              onChange={(e) => set('bio', e.target.value)}
            />
          </div>
          {field('address', 'Address')}
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? (
              <>
                <Spinner size="sm" />
                Saving…
              </>
            ) : mode === 'create' ? (
              'Create faculty'
            ) : (
              'Save changes'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(APP_ROUTES.INSTITUTION_FACULTY)}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </PermissionGate>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
