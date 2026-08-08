/**
 * Label utilities for lesson types, statuses, visibility
 */

import type {
  CourseLessonStatus,
  CourseLessonType,
  CourseLessonVisibility,
  CourseModuleStatus,
  CourseModuleVisibility,
  CourseResourceType,
  CourseResourceVisibility,
} from '@learnova/types';

export function formatLessonType(type: CourseLessonType): string {
  const map: Record<CourseLessonType, string> = {
    video: 'Video',
    pdf: 'PDF',
    markdown: 'Markdown',
    rich_text: 'Rich Text',
    html: 'HTML',
    external_link: 'External Link',
    code_snippet: 'Code Snippet',
    image: 'Image',
    audio: 'Audio',
    presentation: 'Presentation',
    download: 'Download',
  };
  return map[type] ?? type;
}

export function formatLessonStatus(status: CourseLessonStatus): string {
  const map: Record<CourseLessonStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    hidden: 'Hidden',
    archived: 'Archived',
  };
  return map[status] ?? status;
}

export function formatLessonVisibility(visibility: CourseLessonVisibility): string {
  const map: Record<CourseLessonVisibility, string> = {
    private: 'Private',
    enrolled: 'Enrolled',
    public: 'Public',
    preview: 'Preview',
  };
  return map[visibility] ?? visibility;
}

export function formatModuleStatus(status: CourseModuleStatus): string {
  const map: Record<CourseModuleStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    hidden: 'Hidden',
    archived: 'Archived',
  };
  return map[status] ?? status;
}

export function formatModuleVisibility(visibility: CourseModuleVisibility): string {
  const map: Record<CourseModuleVisibility, string> = {
    private: 'Private',
    enrolled: 'Enrolled',
    public: 'Public',
  };
  return map[visibility] ?? visibility;
}

export function formatResourceType(type: CourseResourceType): string {
  const map: Record<CourseResourceType, string> = {
    pdf: 'PDF',
    video: 'Video',
    image: 'Image',
    audio: 'Audio',
    zip: 'ZIP Archive',
    markdown: 'Markdown',
    html: 'HTML',
    external_link: 'External Link',
    presentation: 'Presentation',
  };
  return map[type] ?? type;
}

export function formatResourceVisibility(visibility: CourseResourceVisibility): string {
  const map: Record<CourseResourceVisibility, string> = {
    private: 'Private',
    enrolled: 'Enrolled',
    public: 'Public',
  };
  return map[visibility] ?? visibility;
}

export const LESSON_TYPE_OPTIONS: { value: CourseLessonType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rich_text', label: 'Rich Text' },
  { value: 'html', label: 'HTML' },
  { value: 'external_link', label: 'External Link' },
  { value: 'code_snippet', label: 'Code Snippet' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'download', label: 'Download' },
];

export const LESSON_STATUS_OPTIONS: { value: CourseLessonStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
];

export const LESSON_VISIBILITY_OPTIONS: {
  value: CourseLessonVisibility;
  label: string;
}[] = [
  { value: 'private', label: 'Private' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'public', label: 'Public' },
  { value: 'preview', label: 'Preview' },
];

export const MODULE_STATUS_OPTIONS: { value: CourseModuleStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
];

export const MODULE_VISIBILITY_OPTIONS: {
  value: CourseModuleVisibility;
  label: string;
}[] = [
  { value: 'private', label: 'Private' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'public', label: 'Public' },
];

export const RESOURCE_TYPE_OPTIONS: { value: CourseResourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'zip', label: 'ZIP Archive' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'external_link', label: 'External Link' },
  { value: 'presentation', label: 'Presentation' },
];

export const RESOURCE_VISIBILITY_OPTIONS: {
  value: CourseResourceVisibility;
  label: string;
}[] = [
  { value: 'private', label: 'Private' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'public', label: 'Public' },
];
