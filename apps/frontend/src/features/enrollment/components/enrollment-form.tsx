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
  Spinner,
} from '@learnova/ui';
import { useState } from 'react';
import {
  AcademicYearSelect,
  CourseSelect,
  DepartmentSelect,
  FacultySelect,
  ProgramSelect,
  SectionSelect,
  SemesterSelect,
  StudentSelect,
} from '@/components/shared/entity-selects';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  ENROLLMENT_METHOD_LABELS,
  useCreateEnrollmentMutation,
  type EnrollmentCreateBody,
  type EnrollmentMethod,
} from '@/features/enrollment';
import { ApiClientError } from '@/lib/api/client';
import { useRouter } from '@/lib/i18n/routing';

const METHODS = Object.keys(ENROLLMENT_METHOD_LABELS) as EnrollmentMethod[];

interface EnrollmentFormProps {
  mode: 'create';
}

export function EnrollmentForm(_props: EnrollmentFormProps) {
  const router = useRouter();
  const createMutation = useCreateEnrollmentMutation();
  const pending = createMutation.isPending;

  const [form, setForm] = useState({
    studentId: '',
    courseId: '',
    departmentId: '',
    programId: '',
    academicYearId: '',
    semesterId: '',
    sectionId: '',
    facultyId: '',
    enrollmentMethod: 'manual' as EnrollmentMethod,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    setError(null);
    const body: EnrollmentCreateBody = {
      studentId: form.studentId.trim(),
      courseId: form.courseId.trim(),
      departmentId: form.departmentId.trim() || null,
      programId: form.programId.trim() || null,
      academicYearId: form.academicYearId.trim() || null,
      semesterId: form.semesterId.trim() || null,
      sectionId: form.sectionId.trim() || null,
      facultyId: form.facultyId.trim() || null,
      enrollmentMethod: form.enrollmentMethod,
      notes: form.notes.trim() || null,
    };

    try {
      const created = await createMutation.mutateAsync(body);
      router.push(`${APP_ROUTES.INSTITUTION_ENROLLMENTS}/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to create enrollment.');
    }
  };

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE} enforce>
      <Card className="mx-auto w-full max-w-3xl rounded-2xl border-border/80 shadow-soft-md">
        <CardHeader>
          <CardTitle>Create enrollment</CardTitle>
          <CardDescription>
            Manually enroll a student in a course with optional academic references.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <StudentSelect
              id="studentId"
              label="Student (required)"
              value={form.studentId}
              disabled={pending}
              onChange={(value) => set('studentId', value)}
            />
            <CourseSelect
              id="courseId"
              label="Course (required)"
              value={form.courseId}
              disabled={pending}
              onChange={(value) => set('courseId', value)}
            />
            <FacultySelect
              id="facultyId"
              label="Faculty (optional)"
              value={form.facultyId}
              disabled={pending}
              allowEmpty
              emptyLabel="No faculty assigned"
              onChange={(value) => set('facultyId', value)}
            />
            <DepartmentSelect
              id="departmentId"
              value={form.departmentId}
              disabled={pending}
              onChange={(value) => set('departmentId', value)}
            />
            <ProgramSelect
              id="programId"
              value={form.programId}
              disabled={pending}
              onChange={(value) => set('programId', value)}
            />
            <AcademicYearSelect
              id="academicYearId"
              value={form.academicYearId}
              disabled={pending}
              onChange={(value) => set('academicYearId', value)}
            />
            <SemesterSelect
              id="semesterId"
              value={form.semesterId}
              disabled={pending}
              onChange={(value) => set('semesterId', value)}
            />
            <SectionSelect
              id="sectionId"
              value={form.sectionId}
              disabled={pending}
              onChange={(value) => set('sectionId', value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="enrollmentMethod" className="text-sm font-medium">
              Enrollment method
            </label>
            <select
              id="enrollmentMethod"
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={form.enrollmentMethod ?? 'manual'}
              disabled={pending}
              onChange={(e) => set('enrollmentMethod', e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {ENROLLMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.notes}
              disabled={pending}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Add any notes or comments about this enrollment"
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? (
              <>
                <Spinner size="sm" />
                Creating…
              </>
            ) : (
              'Create enrollment'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(APP_ROUTES.INSTITUTION_ENROLLMENTS)}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </PermissionGate>
  );
}
