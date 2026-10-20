'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@learnova/ui';
import { BookOpen, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  AcademicYearSelect,
  ProgramSelect,
} from '@/components/shared/entity-selects';
import { useCourseList } from '@/features/course';
import { useMyFacultyProfile } from '@/features/faculty';
import { useCurrentAcademicSession, useSemesters } from '@/features/institution';
import { useCreatePracticeLabMutation } from '@/features/practice-lab';
import { PermissionGate } from '@/components/shared/protected-route';
import { Link, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export default function FacultyCreatePracticeLabPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.institution.projects');
  const createMutation = useCreatePracticeLabMutation();
  const session = useCurrentAcademicSession();
  const facultyProfile = useMyFacultyProfile();

  const [programId, setProgramId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.activeYear?.id && !academicYearId) {
      setAcademicYearId(session.activeYear.id);
    }
  }, [session.activeYear?.id, academicYearId]);

  const semestersQuery = useSemesters(
    { page: 1, limit: 50, academicYearId: academicYearId || undefined },
    Boolean(academicYearId),
  );

  const filterSemesterIds = useMemo(
    () => (semestersQuery.data?.items ?? []).map((s) => s.id),
    [semestersQuery.data?.items],
  );

  const semesterNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of semestersQuery.data?.items ?? []) {
      map.set(s.id, s.name);
    }
    return map;
  }, [semestersQuery.data?.items]);

  const coursesQuery = useCourseList(
    {
      page: 1,
      limit: 100,
      sortBy: 'title',
      sortOrder: 'asc',
      includeDeleted: false,
      programId: programId || undefined,
      facultyId: facultyProfile.data?.id,
    },
    Boolean(programId && academicYearId),
  );

  const filteredCourses = useMemo(() => {
    let items = coursesQuery.data?.items ?? [];
    if (filterSemesterIds.length > 0) {
      const allowed = new Set(filterSemesterIds);
      items = items.filter((course) =>
        course.semesterIds?.some((id) => allowed.has(id)),
      );
    }
    return items;
  }, [coursesQuery.data?.items, filterSemesterIds]);

  const coursePickerReady = Boolean(programId && academicYearId);
  const courseEmptyMessage = !programId
    ? t('courseSelectBranchFirst')
    : !academicYearId
      ? t('courseSelectYearFirst')
      : t('courseEmpty');

  return (
    <PermissionGate permission={PERMISSIONS.LAB_WRITE} enforce>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Practice Labs</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Create practice lab</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Attach a coding lab to a course for a specific branch and academic year, then add
            problems and test cases.
          </p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle>Choose course</CardTitle>
            <CardDescription>
              Pick branch and academic year first — only courses for that cohort are shown (your
              assigned courses).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ProgramSelect
                label={t('filterBranch')}
                value={programId}
                btechOnly
                onChange={(id) => {
                  setProgramId(id);
                  setCourseId('');
                }}
              />
              <AcademicYearSelect
                label={t('filterAcademicYear')}
                value={academicYearId}
                onChange={(id) => {
                  setAcademicYearId(id);
                  setCourseId('');
                }}
              />
            </div>

            {!coursePickerReady ? (
              <p className="text-sm text-muted-foreground">{courseEmptyMessage}</p>
            ) : coursesQuery.isLoading || semestersQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{courseEmptyMessage}</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredCourses.map((course) => {
                  const selected = course.id === courseId;
                  const termLabels = (course.semesterIds ?? [])
                    .map((id) => semesterNameById.get(id))
                    .filter(Boolean);
                  return (
                    <li key={course.id}>
                      <button
                        type="button"
                        onClick={() => { setCourseId(course.id); }}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors',
                          selected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border/70 hover:border-primary/40 hover:bg-muted/40',
                        )}
                      >
                        <BookOpen
                          className={cn(
                            'mt-0.5 size-4 shrink-0',
                            selected ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {course.courseCode} — {course.title}
                          </span>
                          {termLabels.length > 0 ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {termLabels.join(' · ')}
                            </span>
                          ) : null}
                        </span>
                        {selected ? (
                          <Check className="size-4 shrink-0 text-primary" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle>Lab details</CardTitle>
            <CardDescription>Draft labs stay private until published.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); }}
                placeholder="Intro to Python"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => { setDescription(e.target.value); }}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={createMutation.isPending || !courseId || !title}
                onClick={async () => {
                  setError(null);
                  try {
                    const lab = await createMutation.mutateAsync({
                      courseId,
                      title,
                      description: description || null,
                      languages: ['python', 'javascript', 'cpp', 'java'],
                    });
                    router.push(
                      APP_ROUTES.FACULTY_PRACTICE_LAB_PROBLEMS.replace(':id', lab.id),
                    );
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to create lab');
                  }
                }}
              >
                Create lab
              </Button>
              <Button variant="outline" asChild>
                <Link href={APP_ROUTES.FACULTY_PRACTICE_LABS}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
