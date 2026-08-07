/**
 * Course Builder Shell — 3-column responsive layout
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@learnova/ui';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  const selectedLesson = selectedLessonId
    ? tree.modules.flatMap((m) => m.lessons).find((l) => l.id === selectedLessonId)
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {!sidebarCollapsed ? (
        <div className="w-80 flex-shrink-0">
          <ModuleSidebar courseId={courseId} modules={tree.modules} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={toggleSidebar}>
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {sidebarCollapsed ? 'Show' : 'Hide'} Sidebar
          </Button>
          <div className="text-xs text-muted-foreground">
            {tree.meta.moduleCount} modules · {tree.meta.lessonCount} lessons
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={toggleProperties}>
            {propertiesCollapsed ? 'Show' : 'Hide'} Properties
            {propertiesCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
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
        <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-border">
          <LessonProperties courseId={courseId} lesson={selectedLesson} />
        </div>
      ) : null}
    </div>
  );
}
