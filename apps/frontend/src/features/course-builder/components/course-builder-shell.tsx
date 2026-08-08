/**
 * Course Builder Shell — 3-column responsive layout
 */

'use client';

import { useEffect } from 'react';
import { APP_ROUTES } from '@learnova/constants';
import { Button } from '@learnova/ui';
import { ChevronRight, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useCourse } from '@/features/course';
import { Link } from '@/lib/i18n/routing';
import { useBuilderStore } from '../store/builder-store';
import { useBuilderTree } from '../hooks/use-builder-queries';
import { ModuleSidebar } from './module-sidebar';
import { LessonEditor } from './lesson-editor';
import { LessonProperties } from './lesson-properties';
import { BuilderEmptyState } from './builder-empty-state';
import {
  BuilderSidebarSkeleton,
  BuilderEditorSkeleton,
  BuilderPropertiesSkeleton,
} from './builder-skeletons';

interface CourseBuilderShellProps {
  courseId: string;
}

export function CourseBuilderShell({ courseId }: CourseBuilderShellProps) {
  const query = useBuilderTree(courseId);
  const courseQuery = useCourse(courseId);
  const selectedLessonId = useBuilderStore((s) => s.selectedLessonId);
  const sidebarCollapsed = useBuilderStore((s) => s.sidebarCollapsed);
  const propertiesCollapsed = useBuilderStore((s) => s.propertiesCollapsed);
  const toggleSidebar = useBuilderStore((s) => s.toggleSidebar);
  const toggleProperties = useBuilderStore((s) => s.toggleProperties);
  const reset = useBuilderStore((s) => s.reset);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (query.isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r border-border">
          <BuilderSidebarSkeleton />
        </div>
        <div className="flex-1">
          <BuilderEditorSkeleton />
        </div>
        <div className="w-80 border-l border-border">
          <BuilderPropertiesSkeleton />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold">Failed to load builder</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.error instanceof Error ? query.error.message : 'Unknown error'}
          </p>
          <Button onClick={() => void query.refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const tree = query.data;
  const courseTitle = courseQuery.data?.title ?? 'Course';
  const selectedLesson = selectedLessonId
    ? tree.modules.flatMap((m) => m.lessons).find((l) => l.id === selectedLessonId)
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!sidebarCollapsed ? (
        <div className="w-80 shrink-0 border-r border-border/80 bg-sidebar/50 backdrop-blur-sm">
          <ModuleSidebar courseId={courseId} modules={tree.modules} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 py-2.5 backdrop-blur-md">
          <Button type="button" variant="ghost" size="sm" className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring" onClick={toggleSidebar}>
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {sidebarCollapsed ? 'Outline' : 'Hide outline'}
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <nav aria-label="Breadcrumb" className="mb-1 flex items-center justify-center gap-1 text-caption text-muted-foreground">
              <Link href={APP_ROUTES.INSTITUTION_COURSES} className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                Courses
              </Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <Link
                href={`${APP_ROUTES.INSTITUTION_COURSES}/${courseId}`}
                className="max-w-[10rem] truncate hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm sm:max-w-xs"
              >
                {courseTitle}
              </Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate font-medium text-foreground">Builder</span>
            </nav>
            <p className="text-caption text-muted-foreground">
              {tree.meta.moduleCount} modules · {tree.meta.lessonCount} lessons
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring" onClick={toggleProperties}>
            {propertiesCollapsed ? 'Properties' : 'Hide properties'}
            {propertiesCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden bg-muted/10">
          {tree.modules.length === 0 ? (
            <BuilderEmptyState type="no-modules" />
          ) : !selectedLesson ? (
            <BuilderEmptyState type="no-lesson-selected" />
          ) : (
            <LessonEditor courseId={courseId} lesson={selectedLesson} />
          )}
        </div>
      </div>

      {!propertiesCollapsed && selectedLesson ? (
        <div className="w-80 shrink-0 overflow-y-auto border-l border-border/80 bg-card/80 backdrop-blur-sm">
          <LessonProperties courseId={courseId} lesson={selectedLesson} />
        </div>
      ) : null}
    </div>
  );
}
