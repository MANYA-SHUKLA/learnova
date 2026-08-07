/**
 * BullMQ job payload contracts — shared by API producers and workers.
 * No business CRUD; infrastructure job shapes only.
 */

export interface EmailJobPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  replyTo?: string;
  correlationId?: string;
}

export interface NotificationJobPayload {
  userId: string;
  channel: 'in_app' | 'push' | 'email';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  correlationId?: string;
}

export interface GradingJobPayload {
  submissionId: string;
  examId?: string;
  labId?: string;
  correlationId?: string;
}

export interface AnalyticsJobPayload {
  metric: string;
  institutionId?: string;
  userId?: string;
  value?: number;
  dimensions?: Record<string, string>;
  occurredAt?: string;
  correlationId?: string;
}

export interface AuditJobPayload {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  occurredAt?: string;
}

export interface LabExecutionJobPayload {
  executionId: string;
  submissionId?: string;
  institutionId: string;
  studentId: string;
  mode: 'run' | 'submit';
  correlationId?: string;
}

export const JOB_NAMES = {
  SEND_EMAIL: 'send-email',
  SEND_NOTIFICATION: 'send-notification',
  GRADE_SUBMISSION: 'grade-submission',
  TRACK_ANALYTICS: 'track-analytics',
  WRITE_AUDIT: 'write-audit',
  EXECUTE_CODE: 'execute-code',
  GRADE_LAB_SUBMISSION: 'grade-lab-submission',
  CLEANUP_EXECUTIONS: 'cleanup-executions',
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
