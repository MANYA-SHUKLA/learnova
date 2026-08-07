import type { ID } from '../common/index.js';

export type CourseStatus = 'draft' | 'review' | 'published' | 'archived' | 'scheduled';

export type CourseVisibility = 'private' | 'institution' | 'public' | 'invite_only';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CourseCategory =
  | 'programming'
  | 'cyber_security'
  | 'ai'
  | 'cloud'
  | 'networking'
  | 'database'
  | 'electronics'
  | 'mechanical'
  | 'mathematics'
  | 'general'
  | 'custom';

export type CourseEnrollmentMode = 'open' | 'approval' | 'invite' | 'closed';

export interface Course {
  id: ID;
  courseCode: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  banner: string | null;
  icon: string | null;
  institutionId: ID;
  campusId: ID | null;
  schoolId: ID | null;
  departmentId: ID | null;
  programIds: ID[];
  semesterIds: ID[];
  facultyIds: ID[];
  coordinatorId: ID | null;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  language: string;
  credits: number;
  estimatedHours: number | null;
  duration: string | null;
  status: CourseStatus;
  visibility: CourseVisibility;
  version: number;
  tags: string[];
  learningObjectives: string[];
  prerequisites: string[];
  requirements: string[];
  outcomes: string[];
  skills: string[];
  certificateEnabled: boolean;
  discussionEnabled: boolean;
  allowDownloads: boolean;
  allowPreview: boolean;
  maxStudents: number | null;
  enrollmentMode: CourseEnrollmentMode;
  enrollmentDeadline: string | null;
  waitlistEnabled: boolean;
  publishDate: string | null;
  archiveDate: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  createdBy: ID | null;
  updatedBy: ID | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CourseStats {
  total: number;
  published: number;
  draft: number;
  review: number;
  archived: number;
  scheduled: number;
  facultyAssigned: number;
  programs: number;
  departments: number;
  averageDurationHours: number;
  totalCredits: number;
  byDepartment: Array<{ departmentId: string | null; label: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byDifficulty: Array<{ difficulty: string; count: number }>;
  recent: Array<{
    id: string;
    title: string;
    courseCode: string;
    status: CourseStatus;
    updatedAt: string;
  }>;
}

export interface CourseImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface CourseImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  errors: CourseImportRowError[];
  sample: Array<Record<string, string>>;
}

export interface CourseImportResult {
  imported: number;
  failed: number;
  errors: CourseImportRowError[];
  courseIds: string[];
}

/** Scaffold only — lesson/content modules are out of scope for Course Management */
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
