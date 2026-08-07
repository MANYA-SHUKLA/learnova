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
import { useState, type ChangeEvent } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import {
  COURSE_CATEGORY_LABELS,
  COURSE_DIFFICULTY_LABELS,
  COURSE_ENROLLMENT_MODE_LABELS,
  COURSE_STATUS_LABELS,
  COURSE_VISIBILITY_LABELS,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  type Course,
  type CourseCreateBody,
} from '@/features/course';
import { ApiClientError } from '@/lib/api/client';
import { useRouter } from '@/lib/i18n/routing';

const CATEGORIES = Object.keys(COURSE_CATEGORY_LABELS) as Array<keyof typeof COURSE_CATEGORY_LABELS>;
const DIFFICULTIES = Object.keys(COURSE_DIFFICULTY_LABELS) as Array<keyof typeof COURSE_DIFFICULTY_LABELS>;
const STATUSES = Object.keys(COURSE_STATUS_LABELS) as Array<keyof typeof COURSE_STATUS_LABELS>;
const VISIBILITIES = Object.keys(COURSE_VISIBILITY_LABELS) as Array<keyof typeof COURSE_VISIBILITY_LABELS>;
const ENROLLMENT_MODES = Object.keys(COURSE_ENROLLMENT_MODE_LABELS) as Array<keyof typeof COURSE_ENROLLMENT_MODE_LABELS>;

interface CourseFormProps {
  mode: 'create' | 'edit';
  initial?: Course;
}

export function CourseForm({ mode, initial }: CourseFormProps) {
  const router = useRouter();
  const createMutation = useCreateCourseMutation();
  const updateMutation = useUpdateCourseMutation();
  const pending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState({
    courseCode: initial?.courseCode ?? '',
    slug: initial?.slug ?? '',
    title: initial?.title ?? '',
    subtitle: initial?.subtitle ?? '',
    description: initial?.description ?? '',
    shortDescription: initial?.shortDescription ?? '',
    campusId: initial?.campusId ?? '',
    schoolId: initial?.schoolId ?? '',
    departmentId: initial?.departmentId ?? '',
    programIds: (initial?.programIds ?? []).join(', '),
    semesterIds: (initial?.semesterIds ?? []).join(', '),
    facultyIds: (initial?.facultyIds ?? []).join(', '),
    coordinatorId: initial?.coordinatorId ?? '',
    category: initial?.category ?? 'programming',
    difficulty: initial?.difficulty ?? 'beginner',
    language: initial?.language ?? 'en',
    credits: String(initial?.credits ?? 3),
    estimatedHours: String(initial?.estimatedHours ?? 0),
    duration: initial?.duration ?? '',
    status: initial?.status ?? 'draft',
    visibility: initial?.visibility ?? 'institution',
    tags: (initial?.tags ?? []).join(', '),
    learningObjectives: (initial?.learningObjectives ?? []).join(', '),
    prerequisites: (initial?.prerequisites ?? []).join(', '),
    requirements: (initial?.requirements ?? []).join(', '),
    outcomes: (initial?.outcomes ?? []).join(', '),
    skills: (initial?.skills ?? []).join(', '),
    certificateEnabled: String(initial?.certificateEnabled ?? false),
    discussionEnabled: String(initial?.discussionEnabled ?? true),
    allowDownloads: String(initial?.allowDownloads ?? false),
    allowPreview: String(initial?.allowPreview ?? true),
    maxStudents: String(initial?.maxStudents ?? 0),
    enrollmentMode: initial?.enrollmentMode ?? 'open',
    publishDate: initial?.publishDate?.slice(0, 10) ?? '',
    archiveDate: initial?.archiveDate?.slice(0, 10) ?? '',
    seoTitle: initial?.seoTitle ?? '',
    seoDescription: initial?.seoDescription ?? '',
    seoKeywords: (initial?.seoKeywords ?? []).join(', '),
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    setError(null);
    const body: CourseCreateBody = {
      courseCode: form.courseCode.trim(),
      slug: form.slug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      shortDescription: form.shortDescription.trim() || null,
      campusId: form.campusId.trim() || null,
      schoolId: form.schoolId.trim() || null,
      departmentId: form.departmentId.trim() || null,
      programIds: form.programIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      semesterIds: form.semesterIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      facultyIds: form.facultyIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      coordinatorId: form.coordinatorId.trim() || null,
      category: form.category as CourseCreateBody['category'],
      difficulty: form.difficulty as CourseCreateBody['difficulty'],
      language: form.language.trim(),
      credits: Number(form.credits) || 0,
      estimatedHours: Number(form.estimatedHours) || null,
      duration: form.duration.trim() || null,
      status: form.status as CourseCreateBody['status'],
      visibility: form.visibility as CourseCreateBody['visibility'],
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      learningObjectives: form.learningObjectives
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      prerequisites: form.prerequisites
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      requirements: form.requirements
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      outcomes: form.outcomes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      certificateEnabled: form.certificateEnabled === 'true',
      discussionEnabled: form.discussionEnabled === 'true',
      allowDownloads: form.allowDownloads === 'true',
      allowPreview: form.allowPreview === 'true',
      maxStudents: Number(form.maxStudents) || null,
      enrollmentMode: form.enrollmentMode as CourseCreateBody['enrollmentMode'],
      publishDate: form.publishDate || null,
      archiveDate: form.archiveDate || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      seoKeywords: form.seoKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync(body);
        router.push(`${APP_ROUTES.INSTITUTION_COURSES}/${created.id}`);
      } else if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, body });
        router.push(`${APP_ROUTES.INSTITUTION_COURSES}/${initial.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save course.');
    }
  };

  const field = (key: keyof typeof form, label: string, opts?: { type?: string; rows?: number }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      {opts?.rows ? (
        <textarea
          id={key}
          rows={opts.rows}
          className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={form[key]}
          disabled={pending}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set(key, e.target.value)}
        />
      ) : (
        <Input
          id={key}
          type={opts?.type ?? 'text'}
          value={form[key]}
          disabled={pending}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
    </div>
  );

  const selectField = <T extends string>(
    key: keyof typeof form,
    label: string,
    options: readonly T[],
    labels: Record<T, string>,
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      <select
        id={key}
        value={form[key]}
        disabled={pending}
        onChange={(e) => set(key, e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels[opt]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <PermissionGate permission={PERMISSIONS.COURSE_MANAGE} enforce>
      <Card className="mx-auto w-full max-w-4xl rounded-2xl border-border/80 shadow-soft-md">
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create course' : 'Edit course'}</CardTitle>
          <CardDescription>
            Define course metadata, academic mappings, learning objectives, and SEO settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Basic information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('courseCode', 'Course code')}
              {field('slug', 'Slug')}
              {field('title', 'Title')}
              {field('subtitle', 'Subtitle')}
            </div>
            {field('shortDescription', 'Short description', { rows: 2 })}
            {field('description', 'Description', { rows: 4 })}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Academic mapping
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('campusId', 'Campus ID (ObjectId)')}
              {field('schoolId', 'School ID (ObjectId)')}
              {field('departmentId', 'Department ID (ObjectId)')}
              {field('programIds', 'Program IDs (comma-separated)')}
              {field('semesterIds', 'Semester IDs (comma-separated)')}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Faculty
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('facultyIds', 'Faculty IDs (comma-separated)')}
              {field('coordinatorId', 'Coordinator ID (ObjectId)')}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Course settings
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {selectField('category', 'Category', CATEGORIES, COURSE_CATEGORY_LABELS)}
              {selectField('difficulty', 'Difficulty', DIFFICULTIES, COURSE_DIFFICULTY_LABELS)}
              {field('language', 'Language')}
              {field('credits', 'Credits', { type: 'number' })}
              {field('estimatedHours', 'Estimated hours', { type: 'number' })}
              {field('duration', 'Duration')}
              {selectField('status', 'Status', STATUSES, COURSE_STATUS_LABELS)}
              {selectField('visibility', 'Visibility', VISIBILITIES, COURSE_VISIBILITY_LABELS)}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Learning objectives & prerequisites
            </h3>
            {field('learningObjectives', 'Learning objectives (comma-separated)', { rows: 2 })}
            {field('prerequisites', 'Prerequisites (comma-separated)', { rows: 2 })}
            {field('requirements', 'Requirements (comma-separated)', { rows: 2 })}
            {field('outcomes', 'Outcomes (comma-separated)', { rows: 2 })}
            {field('skills', 'Skills (comma-separated)', { rows: 2 })}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Enrollment & flags
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {selectField('enrollmentMode', 'Enrollment mode', ENROLLMENT_MODES, COURSE_ENROLLMENT_MODE_LABELS)}
              {field('maxStudents', 'Max students', { type: 'number' })}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="certificateEnabled">
                  Certificate enabled
                </label>
                <select
                  id="certificateEnabled"
                  value={form.certificateEnabled}
                  disabled={pending}
                  onChange={(e) => set('certificateEnabled', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="discussionEnabled">
                  Discussion enabled
                </label>
                <select
                  id="discussionEnabled"
                  value={form.discussionEnabled}
                  disabled={pending}
                  onChange={(e) => set('discussionEnabled', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="allowDownloads">
                  Allow downloads
                </label>
                <select
                  id="allowDownloads"
                  value={form.allowDownloads}
                  disabled={pending}
                  onChange={(e) => set('allowDownloads', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="allowPreview">
                  Allow preview
                </label>
                <select
                  id="allowPreview"
                  value={form.allowPreview}
                  disabled={pending}
                  onChange={(e) => set('allowPreview', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tags & dates
            </h3>
            {field('tags', 'Tags (comma-separated)', { rows: 2 })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('publishDate', 'Publish date', { type: 'date' })}
              {field('archiveDate', 'Archive date', { type: 'date' })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              SEO
            </h3>
            {field('seoTitle', 'SEO title')}
            {field('seoDescription', 'SEO description', { rows: 3 })}
            {field('seoKeywords', 'SEO keywords (comma-separated)', { rows: 2 })}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? (
              <>
                <Spinner size="sm" />
                Saving…
              </>
            ) : (
              mode === 'create' ? 'Create course' : 'Update course'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(APP_ROUTES.INSTITUTION_COURSES)}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </PermissionGate>
  );
}
