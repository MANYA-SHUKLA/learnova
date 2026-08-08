/**
 * Lesson properties sidebar (right panel)
 */

'use client';

import { Input } from '@learnova/ui';
import { useEffect, useState, type ChangeEvent } from 'react';
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

const selectClass =
  'mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

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
            <label className="text-sm font-medium" htmlFor="prop-type">
              Type
            </label>
            <select
              id="prop-type"
              className={selectClass}
              value={localType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value as typeof localType;
                setLocalType(v);
                void update({ lessonType: v });
              }}
            >
              {LESSON_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="prop-status">
              Status
            </label>
            <select
              id="prop-status"
              className={selectClass}
              value={localStatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value as typeof localStatus;
                setLocalStatus(v);
                void update({ status: v });
              }}
            >
              {LESSON_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="prop-visibility">
              Visibility
            </label>
            <select
              id="prop-visibility"
              className={selectClass}
              value={localVisibility}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value as typeof localVisibility;
                setLocalVisibility(v);
                void update({ visibility: v });
              }}
            >
              {LESSON_VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="prop-minutes">
              Estimated minutes
            </label>
            <Input
              id="prop-minutes"
              className="mt-1.5"
              type="number"
              value={localEstimated}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setLocalEstimated(e.target.value); }}
              onBlur={() => {
                const num = parseInt(localEstimated, 10);
                void update({ estimatedMinutes: Number.isNaN(num) ? null : num });
              }}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium">Options</h4>
        <div className="space-y-3">
          {(
            [
              ['prop-comments', 'Allow comments', localComments, setLocalComments, 'allowComments'],
              ['prop-downloads', 'Allow downloads', localDownloads, setLocalDownloads, 'allowDownloads'],
              ['prop-preview', 'Preview access', localPreview, setLocalPreview, 'isPreview'],
              ['prop-locked', 'Locked', localLocked, setLocalLocked, 'isLocked'],
            ] as const
          ).map(([id, label, value, setValue, field]) => (
            <label key={id} className="flex items-center justify-between gap-3 text-sm" htmlFor={id}>
              <span>{label}</span>
              <input
                id={id}
                type="checkbox"
                className="size-4 rounded border-input"
                checked={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const checked = e.target.checked;
                  setValue(checked);
                  void update({ [field]: checked });
                }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
