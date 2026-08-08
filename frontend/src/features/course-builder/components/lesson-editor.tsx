/**
 * Lesson editor with tabs: General | Content | Resources
 */

'use client';

import { useState, useCallback, useEffect, type ChangeEvent } from 'react';
import { Input, Button, Badge } from '@learnova/ui';
import { Save } from 'lucide-react';
import type { CourseBuilderLessonNode } from '@learnova/types';
import { useUpdateLessonMutation } from '../hooks/use-builder-queries';
import { useBuilderStore } from '../store/builder-store';
import { RichTextEditor } from './rich-text-editor';
import { ResourcesPanel } from './resources-panel';
import { formatLessonStatus, formatLessonType } from '../lib/labels';
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback';

interface LessonEditorProps {
  courseId: string;
  lesson: CourseBuilderLessonNode;
}

type TabId = 'general' | 'content' | 'resources';

const fieldClass =
  'mt-1.5 min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm';

export function LessonEditor({ courseId, lesson }: LessonEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const updateMutation = useUpdateLessonMutation(courseId);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const setDirty = useBuilderStore((s) => s.setDirty);
  const markSaved = useBuilderStore((s) => s.markSaved);

  const [localTitle, setLocalTitle] = useState(lesson.title);
  const [localDescription, setLocalDescription] = useState(lesson.description ?? '');
  const [localSummary, setLocalSummary] = useState(lesson.summary ?? '');
  const [localContent, setLocalContent] = useState(lesson.content ?? '');

  useEffect(() => {
    setLocalTitle(lesson.title);
    setLocalDescription(lesson.description ?? '');
    setLocalSummary(lesson.summary ?? '');
    setLocalContent(lesson.content ?? '');
  }, [lesson]);

  const debouncedUpdate = useDebouncedCallback(
    (body: Record<string, unknown>) => {
      void updateMutation
        .mutateAsync({ lessonId: lesson.id, body })
        .then(() => { markSaved(); })
        .catch(() => undefined);
    },
    800,
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      setDirty(true);
      debouncedUpdate({ [field]: value });
    },
    [setDirty, debouncedUpdate],
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'content', label: 'Content' },
    { id: 'resources', label: 'Resources' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold">{lesson.title}</h2>
          <Badge variant="outline">{formatLessonType(lesson.lessonType)}</Badge>
          <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'}>
            {formatLessonStatus(lesson.status)}
          </Badge>
        </div>
        {isDirty ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Save className="size-3 animate-pulse" />
            Saving…
          </div>
        ) : null}
      </div>

      <div className="border-b border-border bg-background">
        <div className="flex gap-1 px-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setActiveTab(tab.id); }}
              className={
                activeTab === tab.id
                  ? 'relative rounded-b-none border-b-2 border-primary'
                  : 'text-muted-foreground'
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="lesson-title">
                Title
              </label>
              <Input
                id="lesson-title"
                className="mt-1.5"
                value={localTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setLocalTitle(e.target.value);
                  handleFieldChange('title', e.target.value);
                }}
                placeholder="Lesson title"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="lesson-description">
                Description
              </label>
              <textarea
                id="lesson-description"
                className={fieldClass}
                value={localDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setLocalDescription(e.target.value);
                  handleFieldChange('description', e.target.value);
                }}
                placeholder="Brief description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="lesson-summary">
                Summary
              </label>
              <textarea
                id="lesson-summary"
                className={fieldClass}
                value={localSummary}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setLocalSummary(e.target.value);
                  handleFieldChange('summary', e.target.value);
                }}
                placeholder="Key takeaways"
                rows={3}
              />
            </div>
          </div>
        ) : null}

        {activeTab === 'content' ? (
          <div className="mx-auto max-w-4xl">
            <RichTextEditor
              content={localContent}
              onChange={(html) => {
                setLocalContent(html);
                handleFieldChange('content', html);
              }}
            />
          </div>
        ) : null}

        {activeTab === 'resources' ? (
          <div className="mx-auto max-w-3xl">
            <ResourcesPanel courseId={courseId} lessonId={lesson.id} resources={lesson.resources} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
