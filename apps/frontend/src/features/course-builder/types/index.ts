/**
 * Course Builder types — extends @learnova/types with UI-specific types
 */

export type {
  CourseModule,
  CourseLesson,
  CourseResource,
  CourseLessonVersion,
  CourseBuilderLessonNode,
  CourseBuilderModuleNode,
  CourseBuilderTree,
  CourseModuleStatus,
  CourseModuleVisibility,
  CourseLessonStatus,
  CourseLessonVisibility,
  CourseLessonType,
  CourseResourceType,
  CourseResourceVisibility,
  ID,
} from '@learnova/types';

// UI-specific types

export interface DraggableModule {
  id: string;
  type: 'module';
}

export interface DraggableLesson {
  id: string;
  type: 'lesson';
  moduleId: string;
}

export type DraggableItem = DraggableModule | DraggableLesson;

export interface ModuleCreatePayload {
  title: string;
  description?: string | null;
  visibility?: string;
  status?: string;
}

export interface ModuleUpdatePayload {
  title?: string;
  slug?: string;
  description?: string | null;
  visibility?: string;
  status?: string;
  icon?: string | null;
  color?: string | null;
  estimatedMinutes?: number | null;
  isLocked?: boolean;
  unlockAfterModuleId?: string | null;
}

export interface LessonCreatePayload {
  moduleId: string;
  title: string;
  lessonType: string;
  description?: string | null;
  content?: string | null;
  visibility?: string;
  status?: string;
}

export interface LessonUpdatePayload {
  title?: string;
  slug?: string;
  description?: string | null;
  summary?: string | null;
  content?: string | null;
  lessonType?: string;
  visibility?: string;
  status?: string;
  estimatedMinutes?: number | null;
  allowComments?: boolean;
  allowDownloads?: boolean;
  isPreview?: boolean;
  isLocked?: boolean;
  unlockAfterLessonId?: string | null;
}

export interface ResourceCreatePayload {
  lessonId: string;
  type: string;
  title: string;
  description?: string | null;
  url?: string | null;
  visibility?: string;
}

export interface ResourceUpdatePayload {
  title?: string;
  description?: string | null;
  url?: string | null;
  visibility?: string;
}

export interface ReorderModulesPayload {
  moduleIds: string[];
}

export interface ReorderLessonsPayload {
  lessonIds: string[];
}

export interface EditorTab {
  id: 'general' | 'content' | 'resources' | 'settings';
  label: string;
}

export interface BuilderFilter {
  status?: string;
  visibility?: string;
  type?: string;
}
