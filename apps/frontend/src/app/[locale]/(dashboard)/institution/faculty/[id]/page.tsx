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
import { ErrorState } from '@/features/institution';
import {
  formatDesignation,
  formatEmploymentType,
  formatFacultyStatus,
  useFaculty,
  useFacultyAudit,
  useFacultyPhotoUploadMutation,
} from '@/features/faculty';
import { Link } from '@/lib/i18n/routing';

export default function FacultyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useFaculty(id);
  const auditQuery = useFacultyAudit(id);
  const photoMutation = useFacultyPhotoUploadMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
        message={query.error instanceof Error ? query.error.message : 'Faculty not found.'}
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
    <PermissionGate permission={PERMISSIONS.FACULTY_READ} enforce>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href={APP_ROUTES.INSTITUTION_FACULTY}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {faculty.fullName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {faculty.employeeId} · {faculty.facultyCode}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{formatFacultyStatus(faculty.status)}</Badge>
                <Badge variant="outline">
                  {formatDesignation(faculty.designation, faculty.customDesignation)}
                </Badge>
              </div>
            </div>
          </div>
          <PermissionGate permission={PERMISSIONS.FACULTY_MANAGE}>
            <Button asChild>
              <Link href={`${APP_ROUTES.INSTITUTION_FACULTY}/${faculty.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          </PermissionGate>
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
              <CardDescription>Upload, replace, or preview via storage abstraction.</CardDescription>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
              />
              <PermissionGate permission={PERMISSIONS.FACULTY_WRITE}>
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
          ['Full name', faculty.fullName],
          ['Email', faculty.email],
          ['Alternate email', faculty.alternateEmail],
          ['Phone', faculty.phone],
          ['Gender', faculty.gender],
          ['Nationality', faculty.nationality],
        ])}

        {section('Employment', [
          ['Designation', formatDesignation(faculty.designation, faculty.customDesignation)],
          ['Employment type', formatEmploymentType(faculty.employmentType)],
          ['Joining date', faculty.joiningDate?.slice(0, 10)],
          ['Experience (years)', String(faculty.experienceYears)],
          ['Status', formatFacultyStatus(faculty.status)],
          ['Active', faculty.isActive ? 'Yes' : 'No'],
        ])}

        {section('Academic / research', [
          ['Highest qualification', faculty.highestQualification],
          ['Specialization', faculty.specialization],
          ['Research areas', faculty.researchAreas.join(', ')],
          ['Department ID', faculty.departmentId],
          ['School ID', faculty.schoolId],
          ['Campus ID', faculty.campusId],
        ])}

        {section('Office & contact', [
          ['Office room', faculty.officeRoom],
          ['Office hours', faculty.officeHours],
          ['Address', faculty.address],
          ['City', faculty.city],
          ['State', faculty.state],
          ['Country', faculty.country],
          ['LinkedIn', faculty.linkedin],
          ['Website', faculty.website],
          ['ORCID', faculty.orcid],
          ['Google Scholar', faculty.googleScholar],
        ])}

        {section('Emergency contact', [
          ['Name', faculty.emergencyContactName],
          ['Phone', faculty.emergencyContactPhone],
          ['Relation', faculty.emergencyContactRelation],
        ])}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Audit timeline</CardTitle>
            <CardDescription>Recent faculty audit events for this record.</CardDescription>
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
