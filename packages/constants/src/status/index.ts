/** Domain status enums as const objects */

export const ENTITY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export const EXAM_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  GRADING: 'grading',
  GRADED: 'graded',
  FAILED: 'failed',
} as const;

export const IDE_SESSION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  STOPPED: 'stopped',
  ERROR: 'error',
} as const;

export const JOB_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
} as const;

export type EntityStatus = (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];
export type ExamStatus = (typeof EXAM_STATUS)[keyof typeof EXAM_STATUS];
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];
export type IdeSessionStatus = (typeof IDE_SESSION_STATUS)[keyof typeof IDE_SESSION_STATUS];
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
