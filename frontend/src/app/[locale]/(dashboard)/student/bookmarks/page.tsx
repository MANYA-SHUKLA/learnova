'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import type { BookmarkTargetType } from '@learnova/types';
import {
  Badge,
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
import { Bookmark, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { displayName, EmptyState, ErrorState } from '@/features/institution';
import { useCourseList } from '@/features/course';
import {
  formatBookmarkTarget,
  useBookmarks,
  useCourseProgress,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useMyProgress,
} from '@/features/progress';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const selectClassName = cn(
  'flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

export default function StudentBookmarksPage() {
  const t = useTranslations('dashboard.student.progress.bookmarks');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addCourseId, setAddCourseId] = useState('');
  const [addTargetType, setAddTargetType] = useState<BookmarkTargetType>('lesson');
  const [addModuleId, setAddModuleId] = useState('');
  const [addLessonId, setAddLessonId] = useState('');
  const [addNote, setAddNote] = useState('');
  const coursesQuery = useCourseList({ page: 1, limit: 200 });
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
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [search],
  );

  const listQuery = useBookmarks(params);
  const deleteMutation = useDeleteBookmarkMutation();
  const createMutation = useCreateBookmarkMutation();
  const items = listQuery.data?.items ?? [];
  const enrolledCourses = myProgressQuery.data?.items ?? [];
  const modules = addCourseProgressQuery.data?.modules ?? [];
  const selectedModule = modules.find((mod) => mod.id === addModuleId);
  const lessonOptions = useMemo(() => {
    if (addTargetType === 'module') return [];
    if (addModuleId && selectedModule) {
      return selectedModule.lessons.map((lesson) => ({
        id: lesson.id,
        label: lesson.title,
      }));
    }
    return modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        id: lesson.id,
        label: `${mod.title} — ${lesson.title}`,
      })),
    );
  }, [addTargetType, addModuleId, selectedModule, modules]);

  const resetAddForm = () => {
    setAddOpen(false);
    setAddCourseId('');
    setAddTargetType('lesson');
    setAddModuleId('');
    setAddLessonId('');
    setAddNote('');
  };

  const openAddForm = () => {
    setAddOpen(true);
    if (!addCourseId && enrolledCourses.length === 1) {
      setAddCourseId(enrolledCourses[0]!.courseId);
    }
  };

  const canSubmit =
    addCourseId &&
    (addTargetType === 'module'
      ? Boolean(addModuleId)
      : Boolean(addLessonId));

  const submitBookmark = async () => {
    if (!canSubmit) return;
    const moduleIdForLesson =
      addModuleId ||
      modules.find((mod) => mod.lessons.some((lesson) => lesson.id === addLessonId))?.id;
    try {
      await createMutation.mutateAsync({
        courseId: addCourseId,
        targetType: addTargetType,
        moduleId:
          addTargetType === 'module' ? addModuleId : moduleIdForLesson || undefined,
        lessonId: addTargetType === 'lesson' ? addLessonId : undefined,
        note: addNote.trim() || undefined,
      });
      resetAddForm();
    } catch {
      /* surfaced via createMutation.isError */
    }
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
              {addOpen ? t('cancel') : t('addBookmark')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {addOpen ? (
              <Card className="rounded-xl border-primary/20 bg-muted/30">
                <CardContent className="space-y-4 p-4">
                  <p className="text-sm text-muted-foreground">{t('addBookmarkHint')}</p>
                  {myProgressQuery.isLoading ? (
                    <Skeleton className="h-9 w-full rounded-xl" />
                  ) : enrolledCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noCoursesEnrolled')}</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="bookmark-course">{t('course')}</Label>
                        <select
                          id="bookmark-course"
                          className={selectClassName}
                          value={addCourseId}
                          onChange={(e) => {
                            setAddCourseId(e.target.value);
                            setAddModuleId('');
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
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="bookmark-type">{t('targetType')}</Label>
                            <select
                              id="bookmark-type"
                              className={selectClassName}
                              value={addTargetType}
                              onChange={(e) => {
                                setAddTargetType(e.target.value as BookmarkTargetType);
                                setAddModuleId('');
                                setAddLessonId('');
                              }}
                            >
                              <option value="lesson">{t('targetLesson')}</option>
                              <option value="module">{t('targetModule')}</option>
                            </select>
                          </div>
                          {addCourseProgressQuery.isLoading ? (
                            <Skeleton className="h-9 w-full rounded-xl" />
                          ) : modules.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('noModules')}</p>
                          ) : (
                            <>
                              {addTargetType === 'module' ? (
                                <div className="space-y-2">
                                  <Label htmlFor="bookmark-module">{t('module')}</Label>
                                  <select
                                    id="bookmark-module"
                                    className={selectClassName}
                                    value={addModuleId}
                                    onChange={(e) => { setAddModuleId(e.target.value); }}
                                  >
                                    <option value="">{t('selectModule')}</option>
                                    {modules.map((mod) => (
                                      <option key={mod.id} value={mod.id}>
                                        {mod.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="bookmark-module-filter">{t('module')}</Label>
                                    <select
                                      id="bookmark-module-filter"
                                      className={selectClassName}
                                      value={addModuleId}
                                      onChange={(e) => {
                                        setAddModuleId(e.target.value);
                                        setAddLessonId('');
                                      }}
                                    >
                                      <option value="">{t('selectModule')}</option>
                                      {modules.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                          {mod.title}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="bookmark-lesson">{t('lesson')}</Label>
                                    {lessonOptions.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        {t('noLessons')}
                                      </p>
                                    ) : (
                                      <select
                                        id="bookmark-lesson"
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
                                </>
                              )}
                            </>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="bookmark-note">{t('noteOptional')}</Label>
                            <Input
                              id="bookmark-note"
                              value={addNote}
                              onChange={(e) => { setAddNote(e.target.value); }}
                              placeholder={t('notePlaceholder')}
                            />
                          </div>
                        </>
                      ) : null}
                      {createMutation.isError ? (
                        <p className="text-sm text-danger">{t('createError')}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={createMutation.isPending || !canSubmit}
                          onClick={() => void submitBookmark()}
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
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
                    {t('addBookmark')}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const href = APP_ROUTES.STUDENT_PROGRESS_COURSE.replace(':id', item.courseId);
                  return (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Bookmark className="size-4 text-primary" />
                            <p className="font-medium">{courseLabel(item.courseId)}</p>
                            <Badge variant="secondary">
                              {formatBookmarkTarget(item.targetType)}
                            </Badge>
                          </div>
                          {item.note ? (
                            <p className="text-sm text-muted-foreground">{item.note}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {item.createdAt.slice(0, 10)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>{t('open')}</Link>
                          </Button>
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
