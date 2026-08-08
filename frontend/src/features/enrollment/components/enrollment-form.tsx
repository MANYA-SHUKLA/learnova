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
import {
  FormDraftStatus,
  FormStepper,
  FormStepperNav,
} from '@/components/shared/form-stepper';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  ENROLLMENT_METHOD_LABELS,
  useCreateEnrollmentMutation,
  type EnrollmentCreateBody,
  type EnrollmentMethod,
} from '@/features/enrollment';
import { useFormDraft } from '@/hooks/use-form-draft';
import { ApiClientError } from '@/lib/api/client';
import { useRouter } from '@/lib/i18n/routing';

const METHODS = Object.keys(ENROLLMENT_METHOD_LABELS) as EnrollmentMethod[];

const ENROLLMENT_FORM_STEPS = [
  { id: 'participants', label: 'Student & course' },
  { id: 'academic', label: 'Academic context' },
  { id: 'details', label: 'Details' },
] as const;

interface EnrollmentFormProps {
  mode: 'create';
}

export function EnrollmentForm(_props: EnrollmentFormProps) {
  const router = useRouter();
  const createMutation = useCreateEnrollmentMutation();
  const pending = createMutation.isPending;
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    data: form,
    setData: setForm,
    clearDraft,
    lastSavedAt,
    hasDraft,
  } = useFormDraft(
    {
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
    },
    { key: 'enrollment-create' },
  );

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed =
    currentStep !== 0 || (form.studentId.trim().length > 0 && form.courseId.trim().length > 0);

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
      clearDraft();
      router.push(`${APP_ROUTES.INSTITUTION_ENROLLMENTS}/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to create enrollment.');
    }
  };

  return (
    <PermissionGate permission={PERMISSIONS.ENROLLMENT_MANAGE} enforce>
      <Card className="mx-auto w-full max-w-3xl rounded-2xl border-border/80 shadow-soft-md">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Create enrollment</CardTitle>
              <CardDescription>
                Manually enroll a student in a course with optional academic references.
              </CardDescription>
            </div>
            <FormDraftStatus lastSavedAt={lastSavedAt} visible={hasDraft} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormStepper
            steps={[...ENROLLMENT_FORM_STEPS]}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />

          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          {currentStep === 0 ? (
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
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
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
          ) : null}

          {currentStep === 2 ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="enrollmentMethod" className="text-sm font-medium">
                  Enrollment method
                </label>
                <select
                  id="enrollmentMethod"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.notes}
                  disabled={pending}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Add any notes or comments about this enrollment"
                />
              </div>
            </>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <FormStepperNav
            currentStep={currentStep}
            totalSteps={ENROLLMENT_FORM_STEPS.length}
            onPrevious={() => setCurrentStep((s) => Math.max(0, s - 1))}
            onNext={() => setCurrentStep((s) => Math.min(ENROLLMENT_FORM_STEPS.length - 1, s + 1))}
            onSubmit={() => void onSubmit()}
            isSubmitting={pending}
            canProceed={canProceed}
            submitLabel="Create enrollment"
            extra={
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={pending}
                onClick={() => router.push(APP_ROUTES.INSTITUTION_ENROLLMENTS)}
              >
                Cancel
              </Button>
            }
          />
        </CardFooter>
      </Card>
    </PermissionGate>
  );
}
