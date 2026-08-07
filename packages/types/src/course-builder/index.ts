import type { ID } from '../common/index.js';

export type CourseModuleStatus = 'draft' | 'published' | 'hidden' | 'archived';
export type CourseModuleVisibility = 'private' | 'enrolled' | 'public';

export type CourseLessonStatus = 'draft' | 'published' | 'hidden' | 'archived';
export type CourseLessonVisibility = 'private' | 'enrolled' | 'public' | 'preview';

export type CourseLessonType =
  | 'video'
  | 'pdf'
  | 'markdown'
  | 'rich_text'
  | 'html'
  | 'external_link'
  | 'code_snippet'
  | 'image'
  | 'audio'
  | 'presentation'
  | 'download';

export type CourseResourceType =
  | 'pdf'
  | 'video'
  | 'image'
  | 'audio'
  | 'zip'
  | 'markdown'
  | 'html'
  | 'external_link'
  | 'presentation';

export type CourseResourceVisibility = 'private' | 'enrolled' | 'public';

export interface CourseModule {
  id: ID;
  courseId: ID;
  title: string;
  slug: string;
  description: string | null;
  moduleNumber: number;
  orderIndex: number;
  estimatedMinutes: number | null;
  visibility: CourseModuleVisibility;
  status: CourseModuleStatus;
  icon: string | null;
  color: string | null;
  isLocked: boolean;
  unlockAfterModuleId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CourseLesson {
  id: ID;
  courseId: ID;
  moduleId: ID;
  title: string;
  slug: string;
  lessonNumber: number;
  orderIndex: number;
  description: string | null;
  summary: string | null;
  content: string | null;
  estimatedMinutes: number | null;
  visibility: CourseLessonVisibility;
  status: CourseLessonStatus;
  lessonType: CourseLessonType;
  allowComments: boolean;
  allowDownloads: boolean;
  isPreview: boolean;
  isLocked: boolean;
  unlockAfterLessonId: ID | null;
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CourseResource {
  id: ID;
  courseId: ID;
  lessonId: ID;
  type: CourseResourceType;
  title: string;
  description: string | null;
  url: string | null;
  storageKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  orderIndex: number;
  visibility: CourseResourceVisibility;
  createdBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CourseLessonVersion {
  id: ID;
  courseId: ID;
  lessonId: ID;
  version: number;
  snapshot: Partial<CourseLesson>;
  createdBy: ID | null;
  createdAt: string;
}

export interface CourseBuilderLessonNode extends CourseLesson {
  resources: CourseResource[];
}

export interface CourseBuilderModuleNode extends CourseModule {
  lessons: CourseBuilderLessonNode[];
}

export interface CourseBuilderTree {
  courseId: ID;
  modules: CourseBuilderModuleNode[];
  meta: {
    moduleCount: number;
    lessonCount: number;
    resourceCount: number;
  };
}
