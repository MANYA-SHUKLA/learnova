import type {
  CourseCategory,
  CourseDifficulty,
  CourseEnrollmentMode,
  CourseStatus,
  CourseVisibility,
} from '@learnova/types';

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Draft',
  review: 'In Review',
  published: 'Published',
  archived: 'Archived',
  scheduled: 'Scheduled',
};

export const COURSE_VISIBILITY_LABELS: Record<CourseVisibility, string> = {
  private: 'Private',
  institution: 'Institution Only',
  public: 'Public',
  invite_only: 'Invite Only',
};

export const COURSE_DIFFICULTY_LABELS: Record<CourseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  programming: 'Programming',
  cyber_security: 'Cyber Security',
  ai: 'Artificial Intelligence',
  cloud: 'Cloud Computing',
  networking: 'Networking',
  database: 'Database',
  electronics: 'Electronics',
  mechanical: 'Mechanical Engineering',
  mathematics: 'Mathematics',
  general: 'General',
  custom: 'Custom',
};

export const COURSE_ENROLLMENT_MODE_LABELS: Record<CourseEnrollmentMode, string> = {
  open: 'Open Enrollment',
  approval: 'Requires Approval',
  invite: 'Invite Only',
  closed: 'Closed',
};

export function formatCourseStatus(status: CourseStatus) {
  return COURSE_STATUS_LABELS[status] ?? status;
}

export function formatCourseVisibility(visibility: CourseVisibility) {
  return COURSE_VISIBILITY_LABELS[visibility] ?? visibility;
}

export function formatCourseDifficulty(difficulty: CourseDifficulty) {
  return COURSE_DIFFICULTY_LABELS[difficulty] ?? difficulty;
}

export function formatCourseCategory(category: CourseCategory) {
  return COURSE_CATEGORY_LABELS[category] ?? category;
}

export function formatCourseEnrollmentMode(mode: CourseEnrollmentMode) {
  return COURSE_ENROLLMENT_MODE_LABELS[mode] ?? mode;
}
