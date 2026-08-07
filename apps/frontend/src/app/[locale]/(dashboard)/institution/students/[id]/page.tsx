'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Spinner,
} from '@learnova/ui';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { PasswordInput } from '@/components/shared/password-input';
import { authApi, useSessions } from '@/features/auth';
import { ErrorState } from '@/features/institution';
import {
  formatStudentStatus,
  formatStudentGender,
  useActivateStudentMutation,
  useDeactivateStudentMutation,
  useStudent,
  useStudentAudit,
  useStudentPhotoUploadMutation,
} from '@/features/student';
import { ApiClientError } from '@/lib/api/client';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const query = useStudent(id);
  const auditQuery = useStudentAudit(id);
  const photoMutation = useStudentPhotoUploadMutation();
  const activateMutation = useActivateStudentMutation();
  const deactivateMutation = useDeactivateStudentMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);

  const isOwnProfile =
    Boolean(query.data?.email) &&
    Boolean(user?.email) &&
    query.data!.email.toLowerCase() === user!.email.toLowerCase();

  const sessionsQuery = useSessions(isOwnProfile);

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

  const section = (title: string, rows: Array<[string, string | null | undefined]>) => (
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
              <Link href={APP_ROUTES.INSTITUTION_STUDENTS}>
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
                {student.scholarship ? <Badge variant="outline">Scholarship</Badge> : null}
                {student.hostelResident ? <Badge variant="outline">Hostel</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.STUDENT_MANAGE}>
              <Button asChild>
                <Link href={`${APP_ROUTES.INSTITUTION_STUDENTS}/${student.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              {student.status === 'active' ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={deactivateMutation.isPending}
                  onClick={() => void deactivateMutation.mutateAsync(student.id)}
                >
                  Deactivate
                </Button>
              ) : student.deletedAt ? null : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={activateMutation.isPending}
                  onClick={() => void activateMutation.mutateAsync(student.id)}
                >
                  Activate
                </Button>
              )}
            </PermissionGate>
          </div>
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
              <CardDescription>Upload, replace, or preview via storage abstraction.</CardDescription>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
              />
              <PermissionGate permission={PERMISSIONS.STUDENT_WRITE}>
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
              </PermissionGate>
              {photoError ? <p className="text-xs text-danger">{photoError}</p> : null}
            </div>
          </CardContent>
        </Card>

        {section('Basic information', [
          ['Full name', student.fullName],
          ['Student ID', student.studentId],
          ['Admission number', student.admissionNumber],
          ['Roll number', student.rollNumber],
          ['Registration number', student.registrationNumber],
          ['Email', student.email],
          ['Alternate email', student.alternateEmail],
          ['Phone', student.phone],
          ['Alternate phone', student.alternatePhone],
          ['Gender', student.gender ? formatStudentGender(student.gender) : null],
          ['Date of birth', student.dateOfBirth?.slice(0, 10)],
          ['Blood group', student.bloodGroup],
          ['Nationality', student.nationality],
          ['Religion', student.religion],
          ['Category', student.category],
        ])}

        {section('Academic details', [
          ['Program ID', student.programId],
          ['Department ID', student.departmentId],
          ['School ID', student.schoolId],
          ['Campus ID', student.campusId],
          ['Academic year ID', student.academicYearId],
          ['Semester ID', student.semesterId],
          ['Section ID', student.sectionId],
          ['Batch ID', student.batchId],
          ['Admission date', student.admissionDate?.slice(0, 10)],
          ['Expected graduation', student.expectedGraduationDate?.slice(0, 10)],
          ['Program duration (years)', student.programDuration?.toString()],
          ['Year of study', student.yearOfStudy?.toString()],
          ['Current semester', student.currentSemester?.toString()],
          ['Status', formatStudentStatus(student.status)],
          ['Active', student.isActive ? 'Yes' : 'No'],
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

        {section('Address', [
          ['Address', student.address],
          ['City', student.city],
          ['State', student.state],
          ['Country', student.country],
          ['Postal code', student.postalCode],
        ])}

        {section('Flags & preferences', [
          ['Scholarship', student.scholarship ? 'Yes' : 'No'],
          ['Hostel resident', student.hostelResident ? 'Yes' : 'No'],
          ['Transport required', student.transportRequired ? 'Yes' : 'No'],
          ['LinkedIn', student.linkedin],
          ['Website', student.website],
        ])}

        {isOwnProfile ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Change password</CardTitle>
              <CardDescription>Update the password for your linked account.</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-md gap-3">
              <PasswordInput
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
              />
              <PasswordInput
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              />
              {passwordError ? <p className="text-sm text-danger">{passwordError}</p> : null}
              {passwordMessage ? <p className="text-sm text-success">{passwordMessage}</p> : null}
              <Button
                type="button"
                disabled={passwordPending}
                onClick={() => {
                  void (async () => {
                    setPasswordPending(true);
                    setPasswordError(null);
                    setPasswordMessage(null);
                    try {
                      await authApi.changePassword(passwordForm);
                      setPasswordMessage('Password updated.');
                      setPasswordForm({ currentPassword: '', newPassword: '' });
                    } catch (err) {
                      setPasswordError(
                        err instanceof ApiClientError ? err.message : 'Unable to change password.',
                      );
                    } finally {
                      setPasswordPending(false);
                    }
                  })();
                }}
              >
                {passwordPending ? (
                  <>
                    <Spinner size="sm" />
                    Updating…
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isOwnProfile ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Login history</CardTitle>
              <CardDescription>Active sessions for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionsQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (sessionsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions found.</p>
              ) : (
                sessionsQuery.data?.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-border/70 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      {session.deviceType ?? 'Device'} · {session.ipAddress ?? 'IP unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active {session.lastActivityAt ?? session.createdAt}
                    </p>
                  </div>
                ))
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/sessions">Manage all sessions</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Activity / audit timeline</CardTitle>
            <CardDescription>Recent student audit events for this record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {auditQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (auditQuery.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events yet.</p>
            ) : (
              auditQuery.data?.items.map((item) => (
                <div
                  key={String(item['id'])}
                  className="rounded-xl border border-border/70 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{String(item['event'])}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(item['createdAt'])}
                    {item['email'] ? ` · ${String(item['email'])}` : ''}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
