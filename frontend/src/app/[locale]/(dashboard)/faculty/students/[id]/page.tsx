'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState, useOrgLabels } from '@/features/institution';
import {
  formatStudentGender,
  formatStudentStatus,
  useStudent,
} from '@/features/student';
import { Link } from '@/lib/i18n/routing';

export default function FacultyStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useStudent(id);
  const labels = useOrgLabels();

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
        message={query.error instanceof Error ? query.error.message : 'Student not found.'}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const student = query.data;

  const section = (title: string, rows: [string, string | null | undefined][]) => (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-sm font-medium">{value || '—'}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <PermissionGate permission={PERMISSIONS.STUDENT_READ} enforce>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href={APP_ROUTES.FACULTY_STUDENTS}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {student.fullName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {student.studentId} · {student.admissionNumber}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{formatStudentStatus(student.status)}</Badge>
                {student.rollNumber ? (
                  <Badge variant="outline">Roll: {student.rollNumber}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {section('Contact', [
          ['Email', student.email],
          ['Alternate email', student.alternateEmail],
          ['Phone', student.phone],
          ['Alternate phone', student.alternatePhone],
          ['Address', student.address],
          ['City', student.city],
          ['State', student.state],
          ['Country', student.country],
          ['Postal code', student.postalCode],
        ])}

        {section('Guardian details', [
          ['Guardian name', student.guardianName],
          ['Guardian relation', student.guardianRelation],
          ['Guardian phone', student.guardianPhone],
          ['Guardian email', student.guardianEmail],
        ])}

        {section('Emergency contact', [
          ['Name', student.emergencyContactName],
          ['Phone', student.emergencyContactPhone],
        ])}

        {section('Academic details', [
          ['Program', labels.program(student.programId)],
          ['Department', labels.department(student.departmentId)],
          ['Academic year', labels.year(student.academicYearId)],
          ['Semester', labels.semester(student.semesterId)],
          ['Section', labels.section(student.sectionId)],
          ['Batch', labels.batch(student.batchId)],
          ['Year of study', student.yearOfStudy?.toString()],
          ['Current semester', student.currentSemester?.toString()],
        ])}

        {section('Basic information', [
          ['Full name', student.fullName],
          ['Student ID', student.studentId],
          ['Admission number', student.admissionNumber],
          ['Roll number', student.rollNumber],
          ['Registration number', student.registrationNumber],
          ['Gender', student.gender ? formatStudentGender(student.gender) : null],
          ['Date of birth', student.dateOfBirth?.slice(0, 10)],
        ])}
      </div>
    </PermissionGate>
  );
}
