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
import { ArrowLeft, Copy, Pencil, FolderOpen } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  formatCourseCategory,
  formatCourseDifficulty,
  formatCourseEnrollmentMode,
  formatCourseStatus,
  formatCourseVisibility,
  useArchiveCourseMutation,
  useCourse,
  useCourseAudit,
  useCourseThumbnailUploadMutation,
  useDuplicateCourseMutation,
  usePublishCourseMutation,
  useRestoreCourseMutation,
  useUnpublishCourseMutation,
} from '@/features/course';
import { Link } from '@/lib/i18n/routing';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useCourse(id);
  const auditQuery = useCourseAudit(id);
  const thumbnailMutation = useCourseThumbnailUploadMutation();
  const publishMutation = usePublishCourseMutation();
  const unpublishMutation = useUnpublishCourseMutation();
  const archiveMutation = useArchiveCourseMutation();
  const restoreMutation = useRestoreCourseMutation();
  const duplicateMutation = useDuplicateCourseMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

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
        message={query.error instanceof Error ? query.error.message : 'Course not found.'}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const course = query.data;

  const onPickThumbnail = async (file: File | null) => {
    if (!file) return;
    setThumbnailError(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'] as const;
    if (!allowed.includes(file.type as (typeof allowed)[number])) {
      setThumbnailError('Use JPEG, PNG, or WebP.');
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
      await thumbnailMutation.mutateAsync({
        id: course.id,
        contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        data,
      });
    } catch (err) {
      setThumbnailError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

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
    <PermissionGate permission={PERMISSIONS.COURSE_READ} enforce>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href={APP_ROUTES.INSTITUTION_COURSES}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {course.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.courseCode} · {course.slug}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant={
                    course.status === 'published'
                      ? 'default'
                      : course.status === 'draft'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {formatCourseStatus(course.status)}
                </Badge>
                <Badge variant="outline">{formatCourseVisibility(course.visibility)}</Badge>
                <Badge variant="outline">{formatCourseDifficulty(course.difficulty)}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.COURSE_WRITE}>
              <Button asChild variant="default">
                <Link href={`/institution/courses/${course.id}/builder`}>
                  <FolderOpen className="size-4" />
                  Open Builder
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.COURSE_MANAGE}>
              <Button asChild variant="outline">
                <Link href={`${APP_ROUTES.INSTITUTION_COURSES}/${course.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              {course.status === 'published' ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={unpublishMutation.isPending}
                  onClick={() => void unpublishMutation.mutateAsync(course.id)}
                >
                  Unpublish
                </Button>
              ) : course.deletedAt ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={restoreMutation.isPending}
                  onClick={() => void restoreMutation.mutateAsync(course.id)}
                >
                  Restore
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={publishMutation.isPending}
                    onClick={() => void publishMutation.mutateAsync(course.id)}
                  >
                    Publish
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={archiveMutation.isPending}
                    onClick={() => void archiveMutation.mutateAsync(course.id)}
                  >
                    Archive
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={duplicateMutation.isPending}
                onClick={() => void duplicateMutation.mutateAsync(course.id)}
              >
                <Copy className="size-4" />
                Duplicate
              </Button>
            </PermissionGate>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-border/80 bg-hero">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex size-32 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
              {course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnail}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-display text-3xl font-semibold text-primary">
                  {course.title[0]}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-base">Course thumbnail</CardTitle>
              <CardDescription>Upload or replace the course thumbnail image.</CardDescription>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void onPickThumbnail(e.target.files?.[0] ?? null)}
              />
              <PermissionGate permission={PERMISSIONS.COURSE_WRITE}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={thumbnailMutation.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {thumbnailMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Uploading…
                    </>
                  ) : (
                    'Upload / replace'
                  )}
                </Button>
              </PermissionGate>
              {thumbnailError ? <p className="text-xs text-danger">{thumbnailError}</p> : null}
            </div>
          </CardContent>
        </Card>

        {section('General', [
          ['Course code', course.courseCode],
          ['Slug', course.slug],
          ['Title', course.title],
          ['Subtitle', course.subtitle],
          ['Category', formatCourseCategory(course.category)],
          ['Difficulty', formatCourseDifficulty(course.difficulty)],
          ['Language', course.language],
          ['Credits', String(course.credits)],
          ['Estimated hours', String(course.estimatedHours ?? 0)],
          ['Duration', course.duration],
          ['Status', formatCourseStatus(course.status)],
          ['Visibility', formatCourseVisibility(course.visibility)],
        ])}

        {section('Academic mapping', [
          ['Institution ID', course.institutionId],
          ['Campus ID', course.campusId],
          ['School ID', course.schoolId],
          ['Department ID', course.departmentId],
          ['Program IDs', course.programIds.join(', ') || 'None'],
          ['Semester IDs', course.semesterIds.join(', ') || 'None'],
        ])}

        {section('Faculty', [
          ['Faculty IDs', course.facultyIds.join(', ') || 'None'],
          ['Coordinator ID', course.coordinatorId],
        ])}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Learning objectives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {course.learningObjectives.length > 0 ? (
              <ul className="list-inside list-disc space-y-1 text-sm">
                {course.learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No objectives defined.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Prerequisites & requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prerequisites
              </p>
              {course.prerequisites.length > 0 ? (
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {course.prerequisites.map((pre, i) => (
                    <li key={i}>{pre}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">None</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requirements
              </p>
              {course.requirements.length > 0 ? (
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {course.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">None</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Skills & outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {course.skills.length > 0 ? (
                  course.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Outcomes
              </p>
              {course.outcomes.length > 0 ? (
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {course.outcomes.map((out, i) => (
                    <li key={i}>{out}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">None</p>
              )}
            </div>
          </CardContent>
        </Card>

        {section('SEO', [
          ['SEO title', course.seoTitle],
          ['SEO description', course.seoDescription],
          ['SEO keywords', course.seoKeywords.join(', ') || 'None'],
        ])}

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Enrollment & flags</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Enrollment mode', formatCourseEnrollmentMode(course.enrollmentMode)],
              ['Max students', String(course.maxStudents ?? 'Unlimited')],
              [
                'Enrollment deadline',
                course.enrollmentDeadline
                  ? new Date(course.enrollmentDeadline).toLocaleDateString()
                  : '—',
              ],
              ['Waitlist', course.waitlistEnabled ? 'Enabled' : 'Disabled'],
              ['Certificate enabled', course.certificateEnabled ? 'Yes' : 'No'],
              ['Discussion enabled', course.discussionEnabled ? 'Yes' : 'No'],
              ['Allow downloads', course.allowDownloads ? 'Yes' : 'No'],
              ['Allow preview', course.allowPreview ? 'Yes' : 'No'],
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

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Audit timeline</CardTitle>
            <CardDescription>Recent course audit events for this record.</CardDescription>
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
