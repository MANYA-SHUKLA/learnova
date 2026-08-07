/**
 * Course Management Types
 * Enterprise course system with modules, lessons, and progress tracking
 */

export type CourseStatus = 'draft' | 'published' | 'archived';

export type LessonContentType =
  | 'video'
  | 'pdf'
  | 'markdown'
  | 'html'
  | 'image'
  | 'audio'
  | 'link'
  | 'embed'
  | 'code'
  | 'download'
  | 'presentation';

export interface Course {
  id: string;
  courseCode: string;
  title: string;
  slug: string;
  description: string | null;
  institutionId: string;
  departmentId: string | null;
  programId: string | null;
  semesterId: string | null;
  credits: number;
  status: CourseStatus;
  facultyIds: string[];
  coordinatorId: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  objectives: string[];
  prerequisites: string[];
  syllabus: string | null;
  tags: string[];
  isActive: boolean;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string | null;
  order: number;
  contentType: LessonContentType;
  contentUrl: string | null;
  contentText: string | null;
  contentMetadata: Record<string, unknown>;
  durationMinutes: number | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CourseProgress {
  id: string;
  courseId: string;
  studentId: string;
  moduleId: string | null;
  lessonId: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
  timeSpentMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseAuditLog {
  id: string;
  courseId: string | null;
  action: string;
  performedBy: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CourseStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  byDepartment: Record<string, number>;
}
