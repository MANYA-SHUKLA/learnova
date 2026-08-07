/**
 * Lesson properties sidebar (right panel)
 */

'use client';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Switch } from '@learnova/ui';
import { useEffect, useState } from 'react';
import type { CourseBuilderLessonNode } from '@learnova/types';
import { useUpdateLessonMutation } from '../hooks/use-builder-queries';
import { useBuilderStore } from '../store/builder-store';
import {
  LESSON_STATUS_OPTIONS,
  LESSON_VISIBILITY_OPTIONS,
  LESSON_TYPE_OPTIONS,
} from '../lib/labels';

interface LessonPropertiesProps {
  courseId: string;
  lesson: CourseBuilderLessonNode;
}

export function LessonProperties({ courseId, lesson }: LessonPropertiesProps) {
  const updateMutation = useUpdateLessonMutation(courseId);
  const setDirty = useBuilderStore((s) => s.setDirty);
  const markSaved = useBuilderStore((s) => s.markSaved);

  const [localType, setLocalType] = useState(lesson.lessonType);
  const [localStatus, setLocalStatus] = useState(lesson.status);
  const [localVisibility, setLocalVisibility] = useState(lesson.visibility);
  const [localEstimated, setLocalEstimated] = useState(String(lesson.estimatedMinutes ?? ''));
  const [localComments, setLocalComments] = useState(lesson.allowComments);
  const [localDownloads, setLocalDownloads] = useState(lesson.allowDownloads);
  const [localPreview, setLocalPreview] = useState(lesson.isPreview);
  const [localLocked, setLocalLocked] = useState(lesson.isLocked);

  useEffect(() => {
    setLocalType(lesson.lessonType);
    setLocalStatus(lesson.status);
    setLocalVisibility(lesson.visibility);
    setLocalEstimated(String(lesson.estimatedMinutes ?? ''));
    setLocalComments(lesson.allowComments);
    setLocalDownloads(lesson.allowDownloads);
    setLocalPreview(lesson.isPreview);
    setLocalLocked(lesson.isLocked);
  }, [lesson]);

  const update = async (body: Record<string, unknown>) => {
    setDirty(true);
    try {
      await updateMutation.mutateAsync({ lessonId: lesson.id, body });
      markSaved();
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="mb-3 font-medium">Lesson Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prop-type">Type</Label>
            <Select
              value={localType}
              onValueChange={(v) => {
                setLocalType(v);
                void update({ lessonType: v });
              }}
            >
              <SelectTrigger id="prop-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prop-status">Status</Label>
            <Select
              value={localStatus}
              onValueChange={(v) => {
                setLocalStatus(v);
                void update({ status: v });
              }}
            >
              <SelectTrigger id="prop-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESSON_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prop-visibility">Visibility</Label>
            <Select
              value={localVisibility}
              onValueChange={(v) => {
                setLocalVisibility(v);
                void update({ visibility: v });
              }}
            >
              <SelectTrigger id="prop-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESSON_VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prop-minutes">Estimated minutes</Label>
            <Input
              id="prop-minutes"
              type="number"
              value={localEstimated}
              onChange={(e) => setLocalEstimated(e.target.value)}
              onBlur={() => {
                const num = parseInt(localEstimated, 10);
                void update({ estimatedMinutes: isNaN(num) ? null : num });
              }}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium">Options</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="prop-comments">Allow comments</Label>
            <Switch
              id="prop-comments"
              checked={localComments}
              onCheckedChange={(checked) => {
                setLocalComments(checked);
                void update({ allowComments: checked });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="prop-downloads">Allow downloads</Label>
            <Switch
              id="prop-downloads"
              checked={localDownloads}
              onCheckedChange={(checked) => {
                setLocalDownloads(checked);
                void update({ allowDownloads: checked });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="prop-preview">Preview access</Label>
            <Switch
              id="prop-preview"
              checked={localPreview}
              onCheckedChange={(checked) => {
                setLocalPreview(checked);
                void update({ isPreview: checked });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="prop-locked">Locked</Label>
            <Switch
              id="prop-locked"
              checked={localLocked}
              onCheckedChange={(checked) => {
                setLocalLocked(checked);
                void update({ isLocked: checked });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
