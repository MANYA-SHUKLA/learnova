import type {
  Course,
  CourseCategory,
  CourseDifficulty,
  CourseEnrollmentMode,
  CourseStatus,
  CourseVisibility,
  PaginatedMeta,
} from '@learnova/types';

export type {
  Course,
  CourseCategory,
  CourseDifficulty,
  CourseEnrollmentMode,
  CourseStatus,
  CourseVisibility,
  CourseStats,
  CourseImportPreview,
  CourseImportResult,
} from '@learnova/types';

export interface CourseListParams {
  q?: string;
  status?: CourseStatus;
  visibility?: CourseVisibility;
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  includeDeleted?: boolean;
  campusId?: string;
  schoolId?: string;
  departmentId?: string;
  programId?: string;
  semesterId?: string;
  facultyId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CourseListResult {
  items: Course[];
  meta: PaginatedMeta;
}

export interface CourseCreateBody {
  courseCode: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  campusId?: string | null;
  schoolId?: string | null;
  departmentId?: string | null;
  programIds?: string[];
  semesterIds?: string[];
  facultyIds?: string[];
  coordinatorId?: string | null;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  language: string;
  credits: number;
  estimatedHours?: number | null;
  duration?: string | null;
  status?: CourseStatus;
  visibility?: CourseVisibility;
  tags?: string[];
  learningObjectives?: string[];
  prerequisites?: string[];
  requirements?: string[];
  outcomes?: string[];
  skills?: string[];
  certificateEnabled?: boolean;
  discussionEnabled?: boolean;
  allowDownloads?: boolean;
  allowPreview?: boolean;
  maxStudents?: number | null;
  enrollmentMode?: CourseEnrollmentMode;
  enrollmentDeadline?: string | null;
  waitlistEnabled?: boolean;
  publishDate?: string | null;
  archiveDate?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
}

export type CourseUpdateBody = Partial<CourseCreateBody>;

export interface CourseBulkIdsBody {
  ids: string[];
}

export interface CourseBulkStatusBody {
  ids: string[];
  status: CourseStatus;
}

export interface CourseBulkVisibilityBody {
  ids: string[];
  visibility: CourseVisibility;
}

export interface CourseBulkAssignFacultyBody {
  ids: string[];
  facultyIds: string[];
  mode?: 'replace' | 'append';
}

export interface CourseBulkAssignProgramBody {
  ids: string[];
  programIds: string[];
  mode?: 'replace' | 'append';
}

export interface CourseThumbnailUploadBody {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}
