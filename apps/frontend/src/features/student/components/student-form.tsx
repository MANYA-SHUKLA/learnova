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
import { CredentialsHandoff } from '@/components/shared/credentials-handoff';
import {
  STUDENT_STATUS_LABELS,
  STUDENT_GENDER_LABELS,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  type Student,
  type StudentCreateBody,
  type StudentCredentials,
} from '@/features/student';
import { ApiClientError } from '@/lib/api/client';
import { useRouter } from '@/lib/i18n/routing';

const GENDERS = Object.keys(STUDENT_GENDER_LABELS) as Array<keyof typeof STUDENT_GENDER_LABELS>;
const STATUSES = Object.keys(STUDENT_STATUS_LABELS) as Array<keyof typeof STUDENT_STATUS_LABELS>;

interface StudentFormProps {
  mode: 'create' | 'edit';
  initial?: Student;
}

export function StudentForm({ mode, initial }: StudentFormProps) {
  const router = useRouter();
  const createMutation = useCreateStudentMutation();
  const updateMutation = useUpdateStudentMutation();
  const pending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState({
    studentId: initial?.studentId ?? '',
    admissionNumber: initial?.admissionNumber ?? '',
    rollNumber: initial?.rollNumber ?? '',
    registrationNumber: initial?.registrationNumber ?? '',
    firstName: initial?.firstName ?? '',
    middleName: initial?.middleName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    alternateEmail: initial?.alternateEmail ?? '',
    alternatePhone: initial?.alternatePhone ?? '',
    gender: initial?.gender ?? '',
    dateOfBirth: initial?.dateOfBirth?.slice(0, 10) ?? '',
    bloodGroup: initial?.bloodGroup ?? '',
    nationality: initial?.nationality ?? '',
    religion: initial?.religion ?? '',
    category: initial?.category ?? '',
    address: initial?.address ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    country: initial?.country ?? '',
    postalCode: initial?.postalCode ?? '',
    guardianName: initial?.guardianName ?? '',
    guardianRelation: initial?.guardianRelation ?? '',
    guardianPhone: initial?.guardianPhone ?? '',
    guardianEmail: initial?.guardianEmail ?? '',
    emergencyContactName: initial?.emergencyContactName ?? '',
    emergencyContactPhone: initial?.emergencyContactPhone ?? '',
    admissionDate: initial?.admissionDate?.slice(0, 10) ?? '',
    expectedGraduationDate: initial?.expectedGraduationDate?.slice(0, 10) ?? '',
    programDuration: String(initial?.programDuration ?? ''),
    yearOfStudy: String(initial?.yearOfStudy ?? ''),
    currentSemester: String(initial?.currentSemester ?? ''),
    campusId: initial?.campusId ?? '',
    schoolId: initial?.schoolId ?? '',
    departmentId: initial?.departmentId ?? '',
    programId: initial?.programId ?? '',
    academicYearId: initial?.academicYearId ?? '',
    semesterId: initial?.semesterId ?? '',
    sectionId: initial?.sectionId ?? '',
    batchId: initial?.batchId ?? '',
    scholarship: initial?.scholarship ?? false,
    hostelResident: initial?.hostelResident ?? false,
    transportRequired: initial?.transportRequired ?? false,
    bio: initial?.bio ?? '',
    linkedin: initial?.linkedin ?? '',
    website: initial?.website ?? '',
    status: initial?.status ?? 'active',
  });
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null);

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    setError(null);
    const body: StudentCreateBody = {
      studentId: form.studentId.trim(),
      admissionNumber: form.admissionNumber.trim(),
      rollNumber: form.rollNumber.trim() || null,
      registrationNumber: form.registrationNumber.trim() || null,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      alternateEmail: form.alternateEmail.trim() || null,
      alternatePhone: form.alternatePhone.trim() || null,
      gender: (form.gender || null) as StudentCreateBody['gender'],
      dateOfBirth: form.dateOfBirth || null,
      bloodGroup: form.bloodGroup.trim() || null,
      nationality: form.nationality.trim() || null,
      religion: form.religion.trim() || null,
      category: form.category.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      country: form.country.trim() || null,
      postalCode: form.postalCode.trim() || null,
      guardianName: form.guardianName.trim() || null,
      guardianRelation: form.guardianRelation.trim() || null,
      guardianPhone: form.guardianPhone.trim() || null,
      guardianEmail: form.guardianEmail.trim() || null,
      emergencyContactName: form.emergencyContactName.trim() || null,
      emergencyContactPhone: form.emergencyContactPhone.trim() || null,
      admissionDate: form.admissionDate || null,
      expectedGraduationDate: form.expectedGraduationDate || null,
      programDuration: form.programDuration ? Number(form.programDuration) : null,
      yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : null,
      currentSemester: form.currentSemester ? Number(form.currentSemester) : null,
      campusId: form.campusId.trim() || null,
      schoolId: form.schoolId.trim() || null,
      departmentId: form.departmentId.trim() || null,
      programId: form.programId.trim() || null,
      academicYearId: form.academicYearId.trim() || null,
      semesterId: form.semesterId.trim() || null,
      sectionId: form.sectionId.trim() || null,
      batchId: form.batchId.trim() || null,
      scholarship: form.scholarship,
      hostelResident: form.hostelResident,
      transportRequired: form.transportRequired,
      bio: form.bio.trim() || null,
      linkedin: form.linkedin.trim() || null,
      website: form.website.trim() || null,
      status: form.status as StudentCreateBody['status'],
    };

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync(body);
        if (created.credentials) {
          setCredentials(created.credentials);
          return;
        }
        router.push(`${APP_ROUTES.INSTITUTION_STUDENTS}/${created.id}`);
      } else if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, body });
        router.push(`${APP_ROUTES.INSTITUTION_STUDENTS}/${initial.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save student.');
    }
  };

  if (credentials) {
    return (
      <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE} enforce>
        <CredentialsHandoff
          credentials={{
            title: 'Student created successfully',
            displayIdLabel: 'Student ID',
            displayId: credentials.studentId,
            email: credentials.email,
            temporaryPassword: credentials.temporaryPassword,
          }}
          onDone={() => router.push(APP_ROUTES.INSTITUTION_STUDENTS)}
        />
      </PermissionGate>
    );
  }

  const field = (key: keyof typeof form, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      <Input
        id={key}
        type={opts?.type ?? 'text'}
        value={String(form[key])}
        disabled={pending}
        placeholder={opts?.placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  const checkbox = (key: keyof typeof form, label: string) => (
    <div className="flex items-center gap-2">
      <input
        id={key}
        type="checkbox"
        checked={Boolean(form[key])}
        disabled={pending}
        onChange={(e) => set(key, e.target.checked)}
        className="h-4 w-4 rounded border-input"
      />
      <label htmlFor={key} className="text-sm font-medium">
        {label}
      </label>
    </div>
  );

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE} enforce>
      <Card className="mx-auto w-full max-w-3xl rounded-2xl border-border/80 shadow-soft-md">
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create student' : 'Edit student'}</CardTitle>
          <CardDescription>
            Capture identity, academic, guardian, and contact details for the student.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {field('studentId', 'Student ID')}
            {field('admissionNumber', 'Admission number')}
            {field('rollNumber', 'Roll number')}
            {field('registrationNumber', 'Registration number')}
            {field('firstName', 'First name', { placeholder: 'Manya' })}
            {field('middleName', 'Middle name')}
            {field('lastName', 'Last name', { placeholder: 'Shukla' })}
            {field('email', 'Email', { type: 'email', placeholder: 'shuklamanya99@gmail.com' })}
            {field('phone', 'Phone', { placeholder: '8005586588' })}
            {field('alternateEmail', 'Alternate email', {
              type: 'email',
              placeholder: 'shuklamanya99@gmail.com',
            })}
            {field('alternatePhone', 'Alternate phone', { placeholder: '8005586588' })}
            {field('dateOfBirth', 'Date of birth', { type: 'date' })}
            {field('bloodGroup', 'Blood group')}
            {field('nationality', 'Nationality')}
            {field('religion', 'Religion')}
            {field('category', 'Category')}
            {field('campusId', 'Campus ID')}
            {field('schoolId', 'School ID')}
            {field('departmentId', 'Department ID')}
            {field('programId', 'Program ID')}
            {field('academicYearId', 'Academic year ID')}
            {field('semesterId', 'Semester ID')}
            {field('sectionId', 'Section ID')}
            {field('batchId', 'Batch ID')}
            {field('admissionDate', 'Admission date', { type: 'date' })}
            {field('expectedGraduationDate', 'Expected graduation date', { type: 'date' })}
            {field('programDuration', 'Program duration (years)', { type: 'number' })}
            {field('yearOfStudy', 'Year of study', { type: 'number' })}
            {field('currentSemester', 'Current semester', { type: 'number' })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="gender"
              label="Gender"
              value={form.gender || ''}
              disabled={pending}
              onChange={(v) => set('gender', v)}
              options={[
                { value: '', label: 'Not set' },
                ...GENDERS.map((g) => ({ value: g, label: STUDENT_GENDER_LABELS[g] })),
              ]}
            />
            <SelectField
              id="status"
              label="Status"
              value={form.status}
              disabled={pending}
              onChange={(v) => set('status', v)}
              options={STATUSES.filter((s) => s !== 'archived').map((s) => ({
                value: s,
                label: STUDENT_STATUS_LABELS[s],
              }))}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Guardian details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('guardianName', 'Guardian name')}
              {field('guardianRelation', 'Guardian relation')}
              {field('guardianPhone', 'Guardian phone')}
              {field('guardianEmail', 'Guardian email', { type: 'email' })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Emergency contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('emergencyContactName', 'Emergency contact name')}
              {field('emergencyContactPhone', 'Emergency contact phone')}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Address</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('address', 'Address')}
              {field('city', 'City')}
              {field('state', 'State')}
              {field('country', 'Country')}
              {field('postalCode', 'Postal code')}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Flags</h3>
            <div className="flex flex-wrap gap-4">
              {checkbox('scholarship', 'Scholarship')}
              {checkbox('hostelResident', 'Hostel resident')}
              {checkbox('transportRequired', 'Transport required')}
            </div>
          </div>

          {field('linkedin', 'LinkedIn')}
          {field('website', 'Website')}
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
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? (
              <>
                <Spinner size="sm" />
                Saving…
              </>
            ) : mode === 'create' ? (
              'Create student'
            ) : (
              'Save changes'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(APP_ROUTES.INSTITUTION_STUDENTS)}
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
