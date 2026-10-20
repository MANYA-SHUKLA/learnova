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
  SemesterSelect,
} from '@/components/shared/entity-selects';
import { useCourseList } from '@/features/course';
import { resolveActiveAcademicYear, useAcademicYears } from '@/features/institution';
import { useCreatePracticeLabMutation } from '@/features/practice-lab';
import { PermissionGate } from '@/components/shared/protected-route';
import { Link, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const LIST_LIMIT = 100;

export default function FacultyCreatePracticeLabPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.institution.projects');
  const createMutation = useCreatePracticeLabMutation();

  const yearsQuery = useAcademicYears({ page: 1, limit: LIST_LIMIT, status: 'active' });

  const [programId, setProgramId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (academicYearId || yearsQuery.isLoading) return;
    const years = yearsQuery.data?.items ?? [];
    if (years.length === 0) return;
    const active = resolveActiveAcademicYear(years) ?? years[0];
    if (active?.id) setAcademicYearId(active.id);
  }, [academicYearId, yearsQuery.data?.items, yearsQuery.isLoading]);

  const coursesQuery = useCourseList({
    page: 1,
    limit: LIST_LIMIT,
    sortBy: 'title',
    sortOrder: 'asc',
    includeDeleted: false,
    programId: programId || undefined,
    semesterId: semesterId || undefined,
  });

  const filteredCourses = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data?.items]);

  const courseEmptyMessage = t('courseEmpty');

  return (
    <PermissionGate permission={PERMISSIONS.LAB_WRITE} enforce>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Practice Labs</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Create practice lab</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a course you teach, or narrow the list with branch, academic year, and term.
          </p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <CardTitle>Choose course</CardTitle>
            <CardDescription>
              Courses you teach (including timetable assignments) are listed below. Optional filters
              help when you have many offerings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <ProgramSelect
                label={t('filterBranch')}
                value={programId}
                btechOnly
                limit={LIST_LIMIT}
                onChange={(id) => {
                  setProgramId(id);
                  setSemesterId('');
                  setCourseId('');
                }}
              />
              <AcademicYearSelect
                label={t('filterAcademicYear')}
                value={academicYearId}
                limit={LIST_LIMIT}
                listParams={{ status: 'active' }}
                onChange={(id) => {
                  setAcademicYearId(id);
                  setSemesterId('');
                  setCourseId('');
                }}
              />
              <SemesterSelect
                label="Semester (term)"
                value={semesterId}
                limit={LIST_LIMIT}
                listParams={{
                  academicYearId: academicYearId || undefined,
                  status: 'active',
                }}
                disabled={!academicYearId}
                onChange={(id) => {
                  setSemesterId(id);
                  setCourseId('');
                }}
              />
            </div>

            {coursesQuery.isLoading || yearsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : coursesQuery.isError ? (
              <p className="text-sm text-destructive">
                {coursesQuery.error instanceof Error
                  ? coursesQuery.error.message
                  : 'Unable to load courses.'}
              </p>
            ) : filteredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{courseEmptyMessage}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Courses ({filteredCourses.length})
                </p>
                <ul className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2">
                  {filteredCourses.map((course) => {
                    const selected = course.id === courseId;
                    return (
                      <li key={course.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setCourseId(course.id);
                          }}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors',
                            selected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'border-transparent bg-background hover:border-primary/30 hover:bg-muted/50',
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
                          </span>
                          {selected ? (
                            <Check className="size-4 shrink-0 text-primary" aria-hidden />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
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
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                placeholder="Intro to Python"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
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
