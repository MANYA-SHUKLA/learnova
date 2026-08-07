/** Assessment Core constants — shared by Assignments, Labs, Quizzes, Exams */

export const ASSESSMENT_KINDS = [
  'assignment',
  'lab',
  'quiz',
  'exam',
  'project',
] as const;

export const ASSESSMENT_LIFECYCLE_STATUSES = [
  'draft',
  'published',
  'archived',
  'closed',
] as const;

export const ASSESSMENT_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

export const ASSESSMENT_ATTEMPT_STATUSES = [
  'draft',
  'submitted',
  'late',
  'returned',
  'graded',
  'missing',
] as const;

export const ASSESSMENT_DELIVERY_TYPES = [
  'text',
  'file',
  'link',
  'mixed',
  'code',
  'interactive',
] as const;

export const ASSESSMENT_GRADING_METHODS = [
  'manual',
  'rubric',
  'pass_fail',
  'marks',
  'percentage',
  'auto',
] as const;

export const ASSESSMENT_AUDIT_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'published',
  'archived',
  'closed',
  'submitted',
  'graded',
  'feedback_added',
  'attachment_uploaded',
  'attempt_started',
  'attempt_expired',
] as const;

/**
 * Module permission triad pattern: `{kind}:read|write|manage`
 * Each assessment module registers its own constants; this documents the contract.
 */
export const ASSESSMENT_PERMISSION_ACTIONS = ['read', 'write', 'manage'] as const;

export function assessmentPermission(
  kind: (typeof ASSESSMENT_KINDS)[number],
  action: (typeof ASSESSMENT_PERMISSION_ACTIONS)[number],
): `${(typeof ASSESSMENT_KINDS)[number]}:${(typeof ASSESSMENT_PERMISSION_ACTIONS)[number]}` {
  return `${kind}:${action}`;
}

/** Enrollment statuses that unlock learner assessment access */
export const ASSESSMENT_ENROLLMENT_STATUSES = ['active', 'approved', 'completed'] as const;

/** Default max upload size for assessment attachments (bytes) */
export const ASSESSMENT_MAX_FILE_BYTES = 50 * 1024 * 1024;

export const ASSESSMENT_ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;
