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
} from '@learnova/ui';
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PermissionGate } from '@/components/shared/protected-route';
import { EmptyState, ErrorState } from '@/features/institution';
import {
  formatLearningStatus,
  formatMinutes,
  formatPercent,
  useCompleteLessonMutation,
  useCourseProgress,
  useOpenLessonMutation,
  useResumePoint,
} from '@/features/progress';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

export default function StudentCourseProgressPage() {
  const t = useTranslations('dashboard.student.progress.course');
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const courseQuery = useCourseProgress(courseId);
  const resumeQuery = useResumePoint(courseId);
  const openLesson = useOpenLessonMutation();
  const completeLesson = useCompleteLessonMutation();

  const detail = courseQuery.data;
  const resume = resumeQuery.data;

  const onResume = async () => {
    if (!resume?.currentModuleId || !resume.currentLessonId) return;
    await openLesson.mutateAsync({
      courseId,
      moduleId: resume.currentModuleId,
      lessonId: resume.currentLessonId,
    });
  };

  return (
    <PermissionGate permission={PERMISSIONS.PROGRESS_READ} enforce>
      <div className="space-y-8">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={APP_ROUTES.STUDENT_PROGRESS}>
              <ArrowLeft className="size-4" />
              {t('back')}
            </Link>
          </Button>
          <div>
            <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {courseQuery.isError ? (
          <ErrorState
            message={
              courseQuery.error instanceof Error ? courseQuery.error.message : t('loadError')
            }
            onRetry={() => void courseQuery.refetch()}
          />
        ) : null}

        {courseQuery.isLoading || !detail ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <Card className="rounded-2xl border-border/80">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{detail.course.courseId}</p>
                    <Badge variant="secondary">
                      {formatLearningStatus(detail.course.status)}
                    </Badge>
                    <Badge variant="outline">
                      {formatPercent(detail.course.progressPercentage)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatMinutes(detail.course.timeSpentMinutes)} learned ·{' '}
                    {formatMinutes(detail.course.estimatedRemainingMinutes)} remaining
                  </p>
                  <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, Math.max(0, detail.course.progressPercentage))}%`,
                      }}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={
                    !resume?.currentModuleId ||
                    !resume.currentLessonId ||
                    openLesson.isPending
                  }
                  onClick={() => void onResume()}
                >
                  <PlayCircle className="size-4" />
                  {t('resume')}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('modulesTitle')}</CardTitle>
                <CardDescription>{t('modulesDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.modules.length === 0 ? (
                  <EmptyState
                    illustration="inbox"
                    title={t('emptyTitle')}
                    description={t('emptyDescription')}
                  />
                ) : (
                  detail.modules.map((module) => (
                    <div
                      key={module.id}
                      className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{module.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMinutes(module.estimatedMinutes)} ·{' '}
                            {module.progress
                              ? formatPercent(module.progress.completionPercentage)
                              : '0%'}
                          </p>
                        </div>
                        {module.progress ? (
                          <Badge variant="outline">
                            {formatLearningStatus(module.progress.status)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{formatLearningStatus('not_started')}</Badge>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {module.lessons.map((lesson) => {
                          const done = lesson.progress?.completed;
                          const active = resume?.currentLessonId === lesson.id;
                          return (
                            <li
                              key={lesson.id}
                              className={cn(
                                'flex flex-col gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                                active && 'border-primary/40 bg-primary/5',
                              )}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.lessonType} · {formatMinutes(lesson.estimatedMinutes)}
                                  {lesson.progress
                                    ? ` · ${formatLearningStatus(lesson.progress.status)}`
                                    : ''}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={openLesson.isPending}
                                  onClick={() =>
                                    void openLesson.mutateAsync({
                                      courseId,
                                      moduleId: module.id,
                                      lessonId: lesson.id,
                                    })
                                  }
                                >
                                  <PlayCircle className="size-3.5" />
                                  {t('open')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={done ? 'secondary' : 'default'}
                                  disabled={done || completeLesson.isPending}
                                  onClick={() =>
                                    void completeLesson.mutateAsync({
                                      courseId,
                                      moduleId: module.id,
                                      lessonId: lesson.id,
                                    })
                                  }
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  {done ? t('completed') : t('complete')}
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
