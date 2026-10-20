'use client';

import { PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@learnova/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { CourseSelect, SemesterSelect } from '@/components/shared/entity-selects';
import { PermissionGate } from '@/components/shared/protected-route';
import { useCourseList } from '@/features/course';
import { useEnrollmentList } from '@/features/enrollment';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useCreateAssignmentMutation, usePublishAssignmentMutation } from '../hooks/use-assignment-queries';

export function GiveAssignmentForm() {
  const t = useTranslations('dashboard.faculty.assignments');
  const createMutation = useCreateAssignmentMutation();
  const publishMutation = usePublishAssignmentMutation();

  const [semesterId, setSemesterId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pending = createMutation.isPending || publishMutation.isPending;

  const coursesQuery = useCourseList({
    page: 1,
    limit: 100,
    sortBy: 'title',
    sortOrder: 'asc',
    ...(semesterId ? { semesterId } : {}),
  });

  const enrollmentQuery = useEnrollmentList(
    courseId ? { courseId, page: 1, limit: 1 } : undefined,
    Boolean(courseId),
  );

  const enrollmentCount = enrollmentQuery.data?.meta?.total ?? 0;

  const courseOptions = coursesQuery.data?.items ?? [];

  const reset = () => {
    setCourseId('');
    setTitle('');
    setDueDate('');
    setInstructions('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!courseId || !title.trim()) return;

    try {
      const created = await createMutation.mutateAsync({
        courseId,
        title: title.trim(),
        instructions: instructions.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignmentType: 'homework',
      });
      const published = await publishMutation.mutateAsync(created.id);
      reset();
      const count =
        published.activeEnrollmentCount ??
        enrollmentQuery.data?.meta?.total ??
        enrollmentCount;
      if (published.noActiveEnrollments || count === 0) {
        setSuccess(t('givenNoEnrollments'));
      } else if (count === 1) {
        setSuccess(t('givenWithCountOne'));
      } else {
        setSuccess(t('givenWithCount', { count }));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('giveError')));
    }
  };

  const courseHint = useMemo(() => {
    if (coursesQuery.isLoading) return t('courseHintLoading');
    if (courseOptions.length === 0) {
      return semesterId ? t('noCoursesForSemester') : t('noCoursesAssigned');
    }
    return semesterId ? t('courseHintFiltered') : t('courseHint');
  }, [courseOptions.length, coursesQuery.isLoading, semesterId, t]);

  const enrollmentHint = useMemo(() => {
    if (!courseId) return null;
    if (enrollmentQuery.isLoading) return null;
    if (enrollmentCount === 0) return t('enrollmentNone');
    if (enrollmentCount === 1) return t('enrollmentVisibleOne');
    return t('enrollmentVisible', { count: enrollmentCount });
  }, [courseId, enrollmentCount, enrollmentQuery.isLoading, t]);

  return (
    <PermissionGate permission={PERMISSIONS.ASSIGNMENT_WRITE} fallback={null}>
      <Card className="rounded-xl border-border/80 shadow-soft-md">
        <CardHeader>
          <CardTitle className="text-card-title">{t('giveTitle')}</CardTitle>
          <CardDescription>{t('giveDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <CourseSelect
              label={t('course')}
              value={courseId}
              limit={100}
              listParams={semesterId ? { semesterId } : undefined}
              placeholder={t('selectCourse')}
              emptyMessage={semesterId ? t('noCoursesForSemester') : t('noCoursesAssigned')}
              hint={courseHint}
              disabled={coursesQuery.isLoading}
              onChange={(value) => {
                setCourseId(value);
                setSuccess(null);
              }}
            />
            <SemesterSelect
              label={t('semesterOptional')}
              value={semesterId}
              limit={100}
              allowEmpty
              emptyLabel={t('allSemesters')}
              onChange={(value) => {
                setSemesterId(value);
                setCourseId('');
                setSuccess(null);
              }}
            />
            <p className="text-xs text-muted-foreground sm:col-span-2">{t('semesterFilterHint')}</p>
            {courseOptions.length > 0 ? (
              <div className="space-y-2 sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">{t('yourCourses')}</p>
                <div className="flex flex-wrap gap-2">
                  {courseOptions.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      className={cn(
                        'rounded-full border px-3 py-1 text-left text-xs transition-colors',
                        courseId === course.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:border-primary/40',
                      )}
                      onClick={() => {
                        setCourseId(course.id);
                        setSuccess(null);
                      }}
                    >
                      <span className="font-medium">{course.courseCode}</span>
                      <span className="text-muted-foreground"> · {course.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {enrollmentHint ? (
              <p
                className={cn(
                  'text-sm sm:col-span-2',
                  enrollmentCount === 0 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {enrollmentHint}
              </p>
            ) : null}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="assignment-title" className="text-sm font-medium">
                {t('titleLabel')}
              </label>
              <Input
                id="assignment-title"
                value={title}
                required
                placeholder={t('titlePlaceholder')}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setSuccess(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="assignment-due" className="text-sm font-medium">
                {t('dueDate')}
              </label>
              <Input
                id="assignment-due"
                type="datetime-local"
                value={dueDate}
                onChange={(event) => {
                  setDueDate(event.target.value);
                }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="assignment-instructions" className="text-sm font-medium">
                {t('instructions')}
              </label>
              <textarea
                id="assignment-instructions"
                className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={instructions}
                placeholder={t('instructionsPlaceholder')}
                onChange={(event) => {
                  setInstructions(event.target.value);
                }}
              />
            </div>
            {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
            {success ? <p className="text-sm text-primary sm:col-span-2">{success}</p> : null}
            <div>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={pending || !courseId || !title.trim() || courseOptions.length === 0}
              >
                {pending ? t('giving') : t('give')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PermissionGate>
  );
}
