'use client';

import { APP_ROUTES, PAGINATION, PERMISSIONS } from '@learnova/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
} from '@learnova/ui';
import { NotebookPen, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { displayName, EmptyState, ErrorState } from '@/features/institution';
import { useCourseList } from '@/features/course';
import {
  useCourseProgress,
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useMyProgress,
  useNotes,
  useUpdateNoteMutation,
} from '@/features/progress';
import {
  filterByStudentSemesterCourses,
  semesterCoursePickerRows,
  useStudentSemesterCourses,
} from '@/features/student';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const selectClassName = cn(
  'flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

export default function StudentNotesPage() {
  const t = useTranslations('dashboard.student.progress.notes');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addCourseId, setAddCourseId] = useState('');
  const [addLessonId, setAddLessonId] = useState('');
  const [addText, setAddText] = useState('');
  const semesterCourses = useStudentSemesterCourses();
  const coursesQuery = useCourseList({
    page: 1,
    limit: PAGINATION.MAX_LIMIT,
    status: 'published',
  });
  const myProgressQuery = useMyProgress({ page: 1, limit: 100 });
  const addCourseProgressQuery = useCourseProgress(addCourseId, Boolean(addCourseId));
  const courseLabel = (id: string) =>
    displayName(coursesQuery.data?.items, id, (course) => `${course.courseCode} — ${course.title}`) ??
    'Course';

  const params = useMemo(
    () => ({
      q: search || undefined,
      page: 1,
      limit: 50,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
    }),
    [search],
  );

  const listQuery = useNotes(params);
  const updateMutation = useUpdateNoteMutation();
  const deleteMutation = useDeleteNoteMutation();
  const createMutation = useCreateNoteMutation();
  const items = filterByStudentSemesterCourses(
    listQuery.data?.items ?? [],
    semesterCourses.courseIds,
    semesterCourses.restrictsToSemester,
  );
  const enrolledCourses = semesterCoursePickerRows(
    semesterCourses.enrollments,
    myProgressQuery.data?.items ?? [],
  );
  const lessonOptions = useMemo(() => {
    const modules = addCourseProgressQuery.data?.modules ?? [];
    return modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        id: lesson.id,
        label: `${mod.title} — ${lesson.title}`,
      })),
    );
  }, [addCourseProgressQuery.data?.modules]);

  const resetAddForm = () => {
    setAddOpen(false);
    setAddCourseId('');
    setAddLessonId('');
    setAddText('');
  };

  const openAddForm = () => {
    setAddOpen(true);
    if (!addCourseId && enrolledCourses.length === 1) {
      setAddCourseId(enrolledCourses[0]!.courseId);
    }
  };

  const submitNewNote = async () => {
    if (!addCourseId || !addLessonId || !addText.trim()) return;
    try {
      await createMutation.mutateAsync({
        courseId: addCourseId,
        lessonId: addLessonId,
        text: addText.trim(),
      });
      resetAddForm();
    } catch {
      /* mutation error surfaced via createMutation.isError */
    }
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setDraft(text);
  };

  const saveEdit = async () => {
    if (!editingId || !draft.trim()) return;
    await updateMutation.mutateAsync({ id: editingId, body: { text: draft.trim() } });
    setEditingId(null);
    setDraft('');
  };

  return (
    <PermissionGate permission={PERMISSIONS.PROGRESS_READ} enforce>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card className="rounded-2xl border-border/80">
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('directory')}</CardTitle>
              <CardDescription>{t('directoryDescription')}</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              onClick={() => (addOpen ? resetAddForm() : openAddForm())}
            >
              <Plus className="size-4" />
              {addOpen ? t('cancel') : t('addNote')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {addOpen ? (
              <Card className="rounded-xl border-primary/20 bg-muted/30">
                <CardContent className="space-y-4 p-4">
                  <p className="text-sm text-muted-foreground">{t('addNoteHint')}</p>
                  {semesterCourses.restrictsToSemester ? (
                    <p className="text-xs text-muted-foreground">{t('semesterCoursesHint')}</p>
                  ) : null}
                  {semesterCourses.isLoading || myProgressQuery.isLoading ? (
                    <Skeleton className="h-9 w-full rounded-xl" />
                  ) : enrolledCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noCoursesEnrolled')}</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="note-course">{t('course')}</Label>
                        <select
                          id="note-course"
                          className={selectClassName}
                          value={addCourseId}
                          onChange={(e) => {
                            setAddCourseId(e.target.value);
                            setAddLessonId('');
                          }}
                        >
                          <option value="">{t('selectCourse')}</option>
                          {enrolledCourses.map((row) => (
                            <option key={row.courseId} value={row.courseId}>
                              {courseLabel(row.courseId)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {addCourseId ? (
                        <div className="space-y-2">
                          <Label htmlFor="note-lesson">{t('lesson')}</Label>
                          {addCourseProgressQuery.isLoading ? (
                            <Skeleton className="h-9 w-full rounded-xl" />
                          ) : lessonOptions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('noLessons')}</p>
                          ) : (
                            <select
                              id="note-lesson"
                              className={selectClassName}
                              value={addLessonId}
                              onChange={(e) => { setAddLessonId(e.target.value); }}
                            >
                              <option value="">{t('selectLesson')}</option>
                              {lessonOptions.map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                  {lesson.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <Label htmlFor="note-text">{t('addNote')}</Label>
                        <textarea
                          id="note-text"
                          value={addText}
                          onChange={(e) => { setAddText(e.target.value); }}
                          rows={4}
                          placeholder={t('notePlaceholder')}
                          className={cn(
                            'flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm',
                            'shadow-sm transition-colors placeholder:text-muted-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          )}
                        />
                      </div>
                      {createMutation.isError ? (
                        <p className="text-sm text-danger">{t('createError')}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            createMutation.isPending ||
                            !addCourseId ||
                            !addLessonId ||
                            !addText.trim()
                          }
                          onClick={() => void submitNewNote()}
                        >
                          {t('save')}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={resetAddForm}>
                          {t('cancel')}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : null}
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('searchPlaceholder')}
                value={q}
                onChange={(e) => { setQ(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(q.trim());
                }}
              />
            </div>

            {listQuery.isError ? (
              <ErrorState
                message={
                  listQuery.error instanceof Error ? listQuery.error.message : t('loadError')
                }
                onRetry={() => void listQuery.refetch()}
              />
            ) : null}

            {listQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                illustration="inbox"
                title={t('emptyTitle')}
                description={t('emptyDescription')}
                action={
                  <Button type="button" size="sm" onClick={openAddForm}>
                    <Plus className="size-4" />
                    {t('addNote')}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const href = APP_ROUTES.STUDENT_PROGRESS_COURSE.replace(':id', item.courseId);
                  const editing = editingId === item.id;
                  return (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <NotebookPen className="size-4 text-primary" />
                            <p className="text-sm font-medium">{courseLabel(item.courseId)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.updatedAt.slice(0, 10)}
                          </p>
                        </div>
                        {editing ? (
                          <textarea
                            value={draft}
                            onChange={(e) => { setDraft(e.target.value); }}
                            rows={4}
                            className={cn(
                              'flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm',
                              'shadow-sm transition-colors placeholder:text-muted-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              'disabled:cursor-not-allowed disabled:opacity-50',
                            )}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm text-foreground/90">
                            {item.text}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>{t('open')}</Link>
                          </Button>
                          {editing ? (
                            <>
                              <Button
                                size="sm"
                                disabled={updateMutation.isPending || !draft.trim()}
                                onClick={() => void saveEdit()}
                              >
                                {t('save')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(null);
                                  setDraft('');
                                }}
                              >
                                {t('cancel')}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { startEdit(item.id, item.text); }}
                            >
                              {t('edit')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deleteMutation.isPending}
                            onClick={() => void deleteMutation.mutateAsync(item.id)}
                          >
                            <Trash2 className="size-4" />
                            {t('remove')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
