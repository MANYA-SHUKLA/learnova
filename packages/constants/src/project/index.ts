/** Enterprise Project Management constants — mirrors assignment/assessment patterns */

import {
  ASSESSMENT_ALLOWED_CONTENT_TYPES,
  ASSESSMENT_MAX_FILE_BYTES,
} from '../assessment/index.js';

export const PROJECT_TYPES = ['individual', 'team', 'hybrid'] as const;

export const PROJECT_STATUSES = ['draft', 'published', 'archived', 'closed'] as const;

export const PROJECT_VISIBILITIES = ['institution', 'enrolled', 'faculty'] as const;

export const PROJECT_SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'late',
  'returned',
  'graded',
  'missing',
] as const;

export const PROJECT_DELIVERY_TYPES = ['text', 'file', 'link', 'mixed'] as const;

export const PROJECT_GRADING_METHODS = [
  'manual',
  'rubric',
  'pass_fail',
  'marks',
  'percentage',
] as const;

export const PROJECT_TEAM_STATUSES = ['forming', 'active', 'dissolved'] as const;

export const PROJECT_TEAM_MEMBER_ROLES = ['leader', 'member'] as const;

export const PROJECT_MILESTONE_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'overdue',
] as const;

export const PROJECT_REVIEW_TYPES = ['peer', 'faculty'] as const;

export const PROJECT_REVIEW_STATUSES = ['draft', 'submitted'] as const;

export const PROJECT_PROGRESS_STATUSES = [
  'not_started',
  'in_progress',
  'submitted',
  'graded',
] as const;

export const PROJECT_AUDIT_EVENTS = [
  'project_created',
  'project_updated',
  'project_deleted',
  'project_published',
  'project_archived',
  'project_closed',
  'team_created',
  'team_joined',
  'team_left',
  'team_dissolved',
  'milestone_created',
  'milestone_updated',
  'milestone_completed',
  'submission_created',
  'submission_graded',
  'review_submitted',
  'attachment_uploaded',
] as const;

export type ProjectAuditEvent = (typeof PROJECT_AUDIT_EVENTS)[number];

export const PROJECT_CSV_HEADERS = [
  'id',
  'courseId',
  'title',
  'projectType',
  'status',
  'totalMarks',
  'passingMarks',
  'weightage',
  'dueDate',
  'closeDate',
  'teamSizeMin',
  'teamSizeMax',
  'createdAt',
] as const;

/** Default max upload size for project attachments (bytes) */
export const PROJECT_MAX_FILE_BYTES = ASSESSMENT_MAX_FILE_BYTES;

export const PROJECT_ALLOWED_CONTENT_TYPES = ASSESSMENT_ALLOWED_CONTENT_TYPES;

export const PROJECT_DEFAULT_TEAM_SIZE_MIN = 1;
export const PROJECT_DEFAULT_TEAM_SIZE_MAX = 6;
export const PROJECT_MAX_TEAM_SIZE = 20;
export const PROJECT_MAX_MILESTONES = 50;
export const PROJECT_MAX_PEER_REVIEWS_REQUIRED = 10;
