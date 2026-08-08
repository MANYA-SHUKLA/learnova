import type {
  BookmarkTargetType,
  CourseProgress,
  LearningActivity,
  LearningBookmark,
  LearningNote,
  LearningStatus,
  LessonProgress,
  ModuleProgress,
  PaginatedMeta,
  ResumePosition,
} from '@learnova/types';

export type {
  BookmarkTargetType,
  CourseProgress,
  FacultyCourseProgressAnalytics,
  InstitutionProgressAnalytics,
  LearningActivity,
  LearningActivityType,
  LearningBookmark,
  LearningNote,
  LearningSession,
  LearningStatus,
  LessonProgress,
  ModuleProgress,
  ProgressStats,
  ResourceProgress,
  ResumePosition,
  StudentProgressDashboard,
} from '@learnova/types';

export interface ProgressListParams {
  q?: string;
  status?: LearningStatus;
  courseId?: string;
  studentId?: string;
  bookmarked?: boolean;
  recent?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProgressListResult {
  items: CourseProgress[];
  meta: PaginatedMeta;
}

export interface BookmarkListParams {
  q?: string;
  courseId?: string;
  targetType?: BookmarkTargetType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BookmarkListResult {
  items: LearningBookmark[];
  meta: PaginatedMeta;
}

export interface NoteListParams {
  q?: string;
  courseId?: string;
  lessonId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NoteListResult {
  items: LearningNote[];
  meta: PaginatedMeta;
}

export interface ActivityListParams {
  courseId?: string;
  studentId?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityListResult {
  items: LearningActivity[];
  meta: PaginatedMeta;
}

export interface CourseLessonProgressItem {
  id: string;
  title: string;
  orderIndex: number;
  lessonType: string;
  estimatedMinutes: number;
  progress: LessonProgress | null;
}

export interface CourseModuleProgressItem {
  id: string;
  title: string;
  orderIndex: number;
  estimatedMinutes: number;
  progress: ModuleProgress | null;
  lessons: CourseLessonProgressItem[];
}

export interface CourseProgressDetail {
  course: CourseProgress;
  modules: CourseModuleProgressItem[];
}

export interface ResumePoint {
  courseId: string;
  currentModuleId: string | null;
  currentLessonId: string | null;
  resumePosition: ResumePosition;
  progressPercentage: number;
  status: LearningStatus;
}

export interface CreateBookmarkBody {
  courseId: string;
  targetType: BookmarkTargetType;
  moduleId?: string;
  lessonId?: string;
  resourceId?: string;
  note?: string;
}

export interface CreateNoteBody {
  courseId: string;
  lessonId: string;
  text: string;
}

export interface UpdateNoteBody {
  text: string;
}

export interface OpenLessonBody {
  courseId: string;
  moduleId: string;
  lessonId: string;
  position?: number;
}

export interface CompleteLessonBody {
  courseId: string;
  moduleId: string;
  lessonId: string;
  watchPercentage?: number;
  readingPercentage?: number;
}

export interface UpdateLessonProgressBody {
  courseId: string;
  moduleId: string;
  lessonId: string;
  watchPercentage?: number;
  readingPercentage?: number;
  lastPosition?: number;
  timeSpentSeconds?: number;
  resumePosition?: Partial<ResumePosition>;
}
